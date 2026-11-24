import { Fragment } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { FlowNode } from "@/data/agenticArchitectureFlows";

interface ArchitectureFlowProps {
  nodes: FlowNode[];
  color: string;
}

const GATE = "#f59e0b";

/** Compact icon flow: horizontal on wide panels, vertical list on narrow ones. */
const ArchitectureFlow = ({ nodes, color }: ArchitectureFlowProps) => (
  <ol className="flex flex-col xl:flex-row xl:items-stretch gap-1.5 xl:gap-1" aria-label="Architecture flow">
    {nodes.map((node, i) => {
      const accent = node.kind === "gate" ? GATE : color;
      const Icon = node.icon;
      return (
        <Fragment key={node.label}>
          <li
            className="flex xl:flex-col items-center gap-3 xl:gap-2 xl:flex-1 xl:min-w-0 rounded-xl border border-border/50 bg-white/[0.02] px-3 py-2.5 xl:px-1.5 xl:py-3 xl:text-center"
            style={node.kind === "gate" ? { borderColor: GATE + "55", borderStyle: "dashed" } : undefined}
          >
            <span
              className="flex shrink-0 items-center justify-center w-9 h-9 rounded-lg border"
              style={{ borderColor: accent + "40", background: accent + "14" }}
            >
              <Icon className="w-[18px] h-[18px]" style={{ color: accent }} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="text-[13px] xl:text-[11.5px] font-medium leading-tight text-foreground">{node.label}</span>
              {node.sub && (
                <span className="text-xs xl:text-[10.5px] leading-snug text-muted-foreground mt-0.5">{node.sub}</span>
              )}
            </span>
          </li>
          {i < nodes.length - 1 && (
            <li aria-hidden className="flex items-center justify-center shrink-0 text-muted-foreground/60">
              <ChevronDown className="w-4 h-4 xl:hidden" />
              <ChevronRight className="w-3.5 h-3.5 hidden xl:block" />
            </li>
          )}
        </Fragment>
      );
    })}
  </ol>
);

export default ArchitectureFlow;
