import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type Props = { id: string; children: React.ReactNode; className?: string };

export default function SectionTitle({ id, children, className }: Props) {
  return (
    <h2
      id={id}
      className={cn(
        anton.className,
        "m-0 text-[26px] font-normal uppercase tracking-[0.02em] text-[#ECECEE] sm:text-[30px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
