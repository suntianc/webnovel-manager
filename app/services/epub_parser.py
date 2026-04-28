import html
import posixpath
import re
import zipfile
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import PurePosixPath
from xml.etree import ElementTree


@dataclass
class ParsedChapter:
    title: str
    content: str


@dataclass
class ParsedEpub:
    title: str | None
    author: str | None
    chapters: list[ParsedChapter]


class _HtmlTextParser(HTMLParser):
    block_tags = {"p", "div", "br", "section", "article", "h1", "h2", "h3", "h4", "li"}
    title_tags = {"h1", "h2", "h3", "title"}

    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.title_parts: list[str] = []
        self._title_depth = 0
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs):
        tag = tag.lower()
        if tag in {"script", "style", "nav"}:
            self._skip_depth += 1
        if tag in self.title_tags:
            self._title_depth += 1
        if tag in self.block_tags:
            self.parts.append("\n")

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        if tag in {"script", "style", "nav"} and self._skip_depth:
            self._skip_depth -= 1
        if tag in self.title_tags and self._title_depth:
            self._title_depth -= 1
        if tag in self.block_tags:
            self.parts.append("\n")

    def handle_data(self, data: str):
        if self._skip_depth:
            return
        text = html.unescape(data).strip()
        if not text:
            return
        self.parts.append(text)
        if self._title_depth:
            self.title_parts.append(text)

    def get_text(self) -> str:
        raw = " ".join(self.parts)
        raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
        raw = re.sub(r"\s*\n\s*", "\n", raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        return raw.strip()

    def get_title(self) -> str | None:
        title = " ".join(self.title_parts).strip()
        return title or None


class EpubParser:
    ns = {
        "container": "urn:oasis:names:tc:opendocument:xmlns:container",
        "opf": "http://www.idpf.org/2007/opf",
        "dc": "http://purl.org/dc/elements/1.1/",
    }

    def parse(self, file_path: str) -> ParsedEpub:
        with zipfile.ZipFile(file_path) as archive:
            opf_path = self._find_opf_path(archive)
            opf_root = ElementTree.fromstring(archive.read(opf_path))
            base_dir = str(PurePosixPath(opf_path).parent)
            if base_dir == ".":
                base_dir = ""
            title = self._metadata_text(opf_root, "title")
            author = self._metadata_text(opf_root, "creator")
            manifest = self._manifest(opf_root)
            spine_ids = self._spine_ids(opf_root)
            chapters = []
            for item_id in spine_ids:
                item = manifest.get(item_id)
                if not item:
                    continue
                href = item.get("href", "")
                media_type = item.get("media-type", "")
                if "html" not in media_type and not href.lower().endswith((".html", ".xhtml", ".htm")):
                    continue
                chapter_path = posixpath.normpath(posixpath.join(base_dir, href))
                if chapter_path not in archive.namelist():
                    continue
                chapter = self._parse_html(archive.read(chapter_path).decode("utf-8", errors="ignore"), chapter_path)
                if chapter.content:
                    chapters.append(chapter)
        return ParsedEpub(title=title, author=author, chapters=chapters)

    def _find_opf_path(self, archive: zipfile.ZipFile) -> str:
        container_xml = archive.read("META-INF/container.xml")
        root = ElementTree.fromstring(container_xml)
        rootfile = root.find(".//container:rootfile", self.ns)
        if rootfile is None:
            raise ValueError("EPUB container.xml 中未找到 rootfile")
        full_path = rootfile.attrib.get("full-path")
        if not full_path:
            raise ValueError("EPUB rootfile 缺少 full-path")
        return full_path

    def _metadata_text(self, opf_root, tag: str) -> str | None:
        node = opf_root.find(f".//dc:{tag}", self.ns)
        if node is None or node.text is None:
            return None
        text = node.text.strip()
        return text or None

    def _manifest(self, opf_root) -> dict[str, dict[str, str]]:
        items = {}
        for item in opf_root.findall(".//opf:manifest/opf:item", self.ns):
            item_id = item.attrib.get("id")
            if item_id:
                items[item_id] = item.attrib
        return items

    def _spine_ids(self, opf_root) -> list[str]:
        ids = []
        for itemref in opf_root.findall(".//opf:spine/opf:itemref", self.ns):
            item_id = itemref.attrib.get("idref")
            if item_id:
                ids.append(item_id)
        return ids

    def _parse_html(self, source: str, fallback_name: str) -> ParsedChapter:
        parser = _HtmlTextParser()
        parser.feed(source)
        content = parser.get_text()
        title = self._normalize_title(parser.get_title()) or self._title_from_content(content) or PurePosixPath(fallback_name).stem
        content = self._strip_leading_title(content, title)
        return ParsedChapter(title=title, content=content)

    def _title_from_content(self, content: str) -> str | None:
        first_line = next((line.strip() for line in content.splitlines() if line.strip()), "")
        if not first_line:
            return None
        if len(first_line) <= 80:
            return self._normalize_title(first_line)
        return None

    def _normalize_title(self, title: str | None) -> str | None:
        if not title:
            return None
        title = re.sub(r"\s+", " ", title).strip()
        parts = title.split(" ")
        if len(parts) % 2 == 0:
            half = len(parts) // 2
            if parts[:half] == parts[half:]:
                title = " ".join(parts[:half])
        return title or None

    def _strip_leading_title(self, content: str, title: str) -> str:
        lines = content.splitlines()
        while lines and lines[0].strip() == title:
            lines.pop(0)
        return "\n".join(lines).strip()
