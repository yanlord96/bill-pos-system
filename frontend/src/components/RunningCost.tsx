import { useState, useEffect } from "react";

interface Props {
  startTime: string;
  hourlyRate: number;
}

export default function RunningCost({ startTime, hourlyRate }: Props) {
  const [cost, setCost] = useState(0);

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(startTime).getTime();
      const hours = ms / 3600000;
      const rounded = Math.ceil(hours * 4) / 4; // round up to 15min
      setCost(rounded * hourlyRate);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime, hourlyRate]);

  return <span>Rp {cost.toLocaleString("id-ID")}</span>;
}
