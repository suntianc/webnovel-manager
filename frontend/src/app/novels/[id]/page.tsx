import { NovelDetail } from "@/components/novels/NovelDetail";

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NovelDetail novelId={Number(id)} />;
}
