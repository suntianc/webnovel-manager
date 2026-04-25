import DashboardLayout from "@/components/layout/DashboardLayout";
import { Icon } from "@/components/ui/Icon";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1192px] items-center px-4 py-6 sm:px-8">
        <section className="w-full rounded-[28px] bg-black p-8 text-white sm:p-[34px]">
          <p className="text-[13px] font-semibold text-highlight-blue">WORKBENCH MODULE</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.08] sm:text-[46px]">{title}</h1>
          <p className="mt-3 max-w-[760px] text-[17px] leading-[1.48] text-[#a1a1a6]">{description}</p>
          <div className="mt-8 inline-flex h-[42px] items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-near-black">
            <Icon name="settings" size={15} />
            模块待接入
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
