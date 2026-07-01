import { Button } from "@/components/ui/Button";
import { Play, Square, Loader2 } from "lucide-react";

export function TimerButton({
  active,
  loading,
  onClick,
}: {
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="xl"
      onClick={onClick}
      disabled={loading}
      variant={active ? "danger" : "primary"}
      className={`w-full h-28 text-2xl font-bold rounded-3xl ${active ? "animate-pulseRing" : ""}`}
    >
      {loading ? (
        <Loader2 className="w-7 h-7 animate-spin" />
      ) : active ? (
        <>
          <Square className="w-7 h-7" /> 结束游戏
        </>
      ) : (
        <>
          <Play className="w-7 h-7" /> 开始游戏
        </>
      )}
    </Button>
  );
}
