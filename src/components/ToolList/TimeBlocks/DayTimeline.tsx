import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { TimeBlock } from "@/types";
import { timeToMinutes, getCurrentDayMinutes } from "@/stores/timeBlockStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useListStore } from "@/stores/listStore";
import styles from "./TimeBlocks.module.css";

interface DayTimelineProps {
  blocks: TimeBlock[];
  activeBlock: TimeBlock | null;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onAddNewBlock: () => void;
}

interface FreeTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

function hexToRgba(hex?: string, alpha = 0.2): string {
  if (!hex || !hex.startsWith("#")) return `rgba(59, 130, 246, ${alpha})`;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  blocks,
  activeBlock,
  selectedBlockId,
  onSelectBlock,
  onAddNewBlock,
}) => {
  const { dayStartTime, dayEndTime } = useSettingsStore();
  const { tasks } = useListStore();

  const [now, setNow] = useState<Date>(new Date());
  const [isUserScrolled, setIsUserScrolled] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Contar tareas pendientes por bloque
  const getPendingCount = useCallback(
    (block: TimeBlock) => {
      return tasks.filter((t) => {
        if (t.isDone) return false;
        if (t.blockId === block.id) return true;
        if (
          block.categoryKey &&
          t.blockCategory &&
          t.blockCategory.toLowerCase() === block.categoryKey.toLowerCase()
        ) {
          return true;
        }
        if (block.listId && t.listId === block.listId) return true;
        return false;
      }).length;
    },
    [tasks]
  );

  // Ordenar bloques por hora de inicio
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  }, [blocks]);

  // Mapear bloques adyacentes (contiguos)
  const adjacencyMap = useMemo(() => {
    const map: Record<string, { hasNext: boolean; hasPrev: boolean }> = {};

    sortedBlocks.forEach((block, idx) => {
      const bStart = timeToMinutes(block.startTime);
      const bEnd = timeToMinutes(block.endTime);

      const hasPrev = sortedBlocks.some(
        (other, oIdx) => oIdx !== idx && timeToMinutes(other.endTime) === bStart
      );
      const hasNext = sortedBlocks.some(
        (other, oIdx) => oIdx !== idx && timeToMinutes(other.startTime) === bEnd
      );

      map[block.id] = { hasNext, hasPrev };
    });

    return map;
  }, [sortedBlocks]);

  // Horas configuradas en ajustes
  const schedStartHour = useMemo(() => {
    const h = parseInt((dayStartTime || "08:00").split(":")[0], 10);
    return isNaN(h) ? 8 : h;
  }, [dayStartTime]);

  const schedEndHour = useMemo(() => {
    const h = parseInt((dayEndTime || "22:00").split(":")[0], 10);
    return isNaN(h) ? 22 : h;
  }, [dayEndTime]);

  // Rango total de horas
  const { startHour, endHour } = useMemo(() => {
    let minH = schedStartHour;
    let maxH = schedEndHour;

    blocks.forEach((b) => {
      const bStartH = Math.floor(timeToMinutes(b.startTime) / 60);
      const bEndH = Math.ceil(timeToMinutes(b.endTime) / 60);
      if (bStartH < minH) minH = bStartH;
      if (bEndH > maxH) maxH = bEndH;
    });

    return { startHour: Math.max(0, minH), endHour: Math.min(24, maxH) };
  }, [blocks, schedStartHour, schedEndHour]);

  const totalMinutes = (endHour - startHour) * 60;
  const startDayMins = startHour * 60;
  const endDayMins = endHour * 60;

  // Calcular bloques de tiempo libre automáticos (Gaps)
  const freeTimeSlots = useMemo(() => {
    const slots: FreeTimeSlot[] = [];
    let currentCursor = startDayMins;

    sortedBlocks.forEach((block) => {
      const bStart = timeToMinutes(block.startTime);
      const bEnd = timeToMinutes(block.endTime);

      if (bStart > currentCursor) {
        slots.push({
          id: `free-${currentCursor}-${bStart}`,
          startTime: minutesToTimeString(currentCursor),
          endTime: minutesToTimeString(bStart),
        });
      }
      currentCursor = Math.max(currentCursor, bEnd);
    });

    if (currentCursor < endDayMins) {
      slots.push({
        id: `free-${currentCursor}-${endDayMins}`,
        startTime: minutesToTimeString(currentCursor),
        endTime: minutesToTimeString(endDayMins),
      });
    }

    return slots;
  }, [sortedBlocks, startDayMins, endDayMins]);

  // Highlights / Estadísticas del día
  const highlights = useMemo(() => {
    let occupiedMins = 0;
    sortedBlocks.forEach((b) => {
      const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
      if (dur > 0) occupiedMins += dur;
    });

    let freeMins = 0;
    freeTimeSlots.forEach((slot) => {
      const dur = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      if (dur > 0) freeMins += dur;
    });

    // Tareas hoy
    const allBlockCategoryKeys = new Set(blocks.map((b) => b.categoryKey).filter(Boolean));
    const allBlockIds = new Set(blocks.map((b) => b.id));

    const todayTasks = tasks.filter(
      (t) =>
        (t.blockId && allBlockIds.has(t.blockId)) ||
        (t.blockCategory && allBlockCategoryKeys.has(t.blockCategory.toLowerCase()))
    );

    const pendingTodayCount = todayTasks.filter((t) => !t.isDone).length;
    const completedTodayCount = todayTasks.filter((t) => t.isDone).length;

    const formatMins = (totalM: number) => {
      const h = Math.floor(totalM / 60);
      const m = totalM % 60;
      return `${h}h ${m > 0 ? `${m}m` : ""}`;
    };

    return {
      occupiedText: formatMins(occupiedMins),
      freeText: formatMins(freeMins),
      pendingTodayCount,
      completedTodayCount,
    };
  }, [sortedBlocks, freeTimeSlots, blocks, tasks]);

  // Actualizar la hora actual cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const currentMins = getCurrentDayMinutes(now);
  let currentPercent = ((currentMins - startDayMins) / totalMinutes) * 100;
  const isTimeInBounds = currentPercent >= 0 && currentPercent <= 100;
  currentPercent = Math.max(0, Math.min(100, currentPercent));

  // Función para recentrar el scroll en la línea roja
  const scrollToCurrentTime = useCallback((smooth = true) => {
    if (!wrapperRef.current) return;
    const container = wrapperRef.current;
    const gridHeight = container.scrollHeight;
    const containerHeight = container.clientHeight;

    const targetTop = (currentPercent / 100) * gridHeight - containerHeight / 2;
    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth ? "smooth" : "auto",
    });
    setIsUserScrolled(false);
  }, [currentPercent]);

  // Centrar al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentTime(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToCurrentTime]);

  // Auto-seguimiento
  useEffect(() => {
    if (!isUserScrolled) {
      scrollToCurrentTime(true);
    }
  }, [now, isUserScrolled, scrollToCurrentTime]);

  const handleScroll = () => {
    setIsUserScrolled(true);
  };

  const formatTimeLabel = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const hoursList = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const schedStartMins = timeToMinutes(dayStartTime || "08:00");
  const schedEndMins = timeToMinutes(dayEndTime || "22:00");

  const startBoundaryPct = ((schedStartMins - startDayMins) / totalMinutes) * 100;
  const endBoundaryPct = ((schedEndMins - startDayMins) / totalMinutes) * 100;

  return (
    <div className={styles.nowCard}>
      {/* Header del Bloque Activo */}
      <div className={styles.nowHeader}>
        {/* Fila 1: Chip del bloque activo alineado a la derecha */}
        <div className={styles.nowChipRow}>
          {activeBlock ? (
            <div
              className={styles.nowChip}
              style={{ backgroundColor: activeBlock.color || "#3b82f6", width: "100%", display: "flex", justifyContent: "center" }}
            >
              <span className={styles.nowChipPulse} />
              <span>{activeBlock.icon} {activeBlock.name}</span>
            </div>
          ) : (
            <div className={styles.nowChip} style={{ backgroundColor: "#64748b" }}>
              <span>☕ Tiempo Libre</span>
            </div>
          )}
        </div>

        {/* Fila 2: Botones llenando el ancho disponible */}
        <div className={styles.headerActionsRow}>
          <button
            type="button"
            className={styles.actionBtnFull}
            onClick={() => scrollToCurrentTime(true)}
            title="Recentrar a hora actual"
          >
            📍 Hora Actual
          </button>

          <button
            type="button"
            className={styles.actionBtnFull}
            onClick={onAddNewBlock}
          >
            + Bloque
          </button>
        </div>
      </div>

      {/* Contenedor de la línea de tiempo scrollable */}
      <div
        ref={wrapperRef}
        className={styles.timelineWrapper}
        onScroll={handleScroll}
      >
        <div className={styles.timelineGrid}>
          {/* Filas de horas */}
          {hoursList.map((h) => (
            <div key={h} className={styles.hourRow}>
              <span className={styles.hourLabel}>
                {h.toString().padStart(2, "0")}:00
              </span>
              <div className={styles.hourLine} />
            </div>
          ))}

          {/* Marcas de Inicio / Fin de Jornada Configurada */}
          {startBoundaryPct >= 0 && startBoundaryPct <= 100 && (
            <div
              className={styles.dayBoundaryLine}
              style={{ top: `${startBoundaryPct}%` }}
            >
              <span className={styles.dayBoundaryBadge}>
                🌅 Inicio del día ({dayStartTime})
              </span>
            </div>
          )}

          {endBoundaryPct >= 0 && endBoundaryPct <= 100 && (
            <div
              className={styles.dayBoundaryLine}
              style={{ top: `${endBoundaryPct}%` }}
            >
              <span className={styles.dayBoundaryBadge}>
                🌙 Fin del día ({dayEndTime})
              </span>
            </div>
          )}

          {/* Bloques de la timeline */}
          <div className={styles.timelineBlocksOverlay}>
            {/* ☕ Bloques de Tiempo Libre (Gaps automáticos) */}
            {freeTimeSlots.map((slot) => {
              const sStartMins = timeToMinutes(slot.startTime);
              const sEndMins = timeToMinutes(slot.endTime);

              const topPct = Math.max(
                0,
                ((sStartMins - startDayMins) / totalMinutes) * 100
              );
              const heightPct = Math.min(
                100 - topPct,
                ((sEndMins - sStartMins) / totalMinutes) * 100
              );

              if (heightPct <= 0) return null;

              return (
                <div
                  key={slot.id}
                  className={styles.freeTimeBlockCard}
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onClick={onAddNewBlock}
                  title={`Tiempo libre (${slot.startTime} - ${slot.endTime}). Toca para agregar un bloque.`}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    ☕ Tiempo Libre ({slot.startTime} - {slot.endTime})
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", opacity: 0.8 }}>
                    + Agregar
                  </span>
                </div>
              );
            })}

            {/* 💼 Bloques de Usuario */}
            {blocks.map((block) => {
              const bStartMins = timeToMinutes(block.startTime);
              const bEndMins = timeToMinutes(block.endTime);
              const durationMins = bEndMins - bStartMins;

              const topPct = Math.max(
                0,
                ((bStartMins - startDayMins) / totalMinutes) * 100
              );
              const heightPct = Math.min(
                100 - topPct,
                (durationMins / totalMinutes) * 100
              );

              const isSelected = selectedBlockId === block.id;
              const blockColor = block.color || "#3b82f6";
              const pendingCount = getPendingCount(block);
              const { hasNext, hasPrev } = adjacencyMap[block.id] || {};

              const isShortBlock = durationMins <= 60; // 1 hora o menos

              return (
                <div
                  key={block.id}
                  className={`${styles.blockCard} ${isSelected ? styles.blockCardSelected : ""
                    }`}
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    border: `1px solid ${blockColor}`,
                    borderLeft: `5px solid ${blockColor}`,
                    borderTopLeftRadius: hasPrev ? "2px" : "10px",
                    borderTopRightRadius: hasPrev ? "2px" : "10px",
                    borderBottomLeftRadius: hasNext ? "2px" : "10px",
                    borderBottomRightRadius: hasNext ? "2px" : "10px",
                    backgroundColor: hexToRgba(blockColor, 0.16),
                    boxShadow: isSelected
                      ? `0 4px 18px ${hexToRgba(blockColor, 0.55)}, 0 0 12px ${hexToRgba(blockColor, 0.35)}`
                      : `0 2px 8px ${hexToRgba(blockColor, 0.1)}`,
                  }}
                  onClick={() => onSelectBlock(block.id)}
                  title={`${block.name} (${block.startTime} - ${block.endTime})`}
                >
                  {isShortBlock ? (
                    /* Layout compacto sticky para bloques cortos (<= 60 min) */
                    <div className={styles.blockCompactStack}>
                      <div className={styles.blockCompactHeader}>
                        <h5 className={styles.blockCompactTitle}>
                          {block.icon} {block.name}
                        </h5>
                        <span className={styles.blockCompactTime}>
                          {block.startTime}-{block.endTime}
                        </span>
                      </div>
                      <div
                        className={styles.blockCompactTaskCount}
                        style={{
                          color: pendingCount > 0 ? "var(--text-primary)" : "var(--success-color)",
                        }}
                      >
                        {pendingCount > 0 ? `📝 ${pendingCount} pend.` : "✨ 0 pend."}
                      </div>
                    </div>
                  ) : (
                    /* Layout estándar sticky para bloques normales (> 60 min) */
                    <div className={styles.blockContentStack}>
                      <div className={styles.blockTitleRow}>
                        {block.icon} {block.name}
                      </div>
                      <div className={styles.blockSubRow}>
                        {block.startTime} - {block.endTime}
                      </div>
                      <div
                        className={styles.blockTaskCountRow}
                        style={{
                          color: pendingCount > 0 ? "var(--text-primary)" : "var(--success-color)",
                        }}
                      >
                        {pendingCount > 0
                          ? `📝 ${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`
                          : `✨ 0 pendientes`}
                      </div>
                    </div>
                  )}

                  {/* Conector sutil para bloques contiguos */}
                  {hasNext && <div className={styles.blockConnectorDot} />}
                </div>
              );
            })}

            {/* Línea Roja Dinámica de Hora Actual (Etiqueta a la derecha) */}
            {isTimeInBounds && (
              <div
                className={styles.currentTimeLine}
                style={{ top: `${currentPercent}%` }}
              >
                <span className={styles.currentTimeDot} />
                <span className={styles.currentTimeLabel}>
                  📍 {formatTimeLabel(now)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights / Estadísticas Resumen del Día */}
      <div className={styles.highlightsGrid}>
        <div className={styles.highlightCard}>
          <span className={styles.highlightLabel}>⏱️ Ocupado</span>
          <span className={styles.highlightValue}>{highlights.occupiedText}</span>
        </div>
        <div className={styles.highlightCard}>
          <span className={styles.highlightLabel}>☕ Disponible</span>
          <span className={styles.highlightValue}>{highlights.freeText}</span>
        </div>
        <div className={styles.highlightCard}>
          <span className={styles.highlightLabel}>📝 Pendientes</span>
          <span className={styles.highlightValue}>{highlights.pendingTodayCount}</span>
        </div>
        <div className={styles.highlightCard}>
          <span className={styles.highlightLabel}>✅ Completadas</span>
          <span className={styles.highlightValue}>{highlights.completedTodayCount}</span>
        </div>
      </div>
    </div>
  );
};

export default DayTimeline;
