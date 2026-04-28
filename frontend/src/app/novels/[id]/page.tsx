import { NovelDetail } from "@/components/novels/NovelDetail";

export default function NovelDetailPage({ params }: { params: { id: string } }) {
  return <NovelDetail novelId={Number(params.id)} />;
}
