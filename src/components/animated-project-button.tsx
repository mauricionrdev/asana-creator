"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./animated-project-button.module.css";

type VisualState = "idle" | "starting" | "loading" | "stopping";

function Icon({
  name,
  filled = false,
  className
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className ?? ""}`.trim()}
      style={{
        fontFamily: '"Material Symbols Outlined"',
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 1,
        display: "inline-block",
        textTransform: "none",
        letterSpacing: "normal",
        whiteSpace: "nowrap",
        direction: "ltr",
        WebkitFontSmoothing: "antialiased",
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24"
      }}
    >
      {name}
    </span>
  );
}

export function AnimatedProjectButton({
  busy,
  disabled = false,
  onClick,
  type = "button"
}: {
  busy: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const [visualState, setVisualState] = useState<VisualState>(busy ? "loading" : "idle");
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    if (busy) {
      const startTimer = window.setTimeout(() => {
        setVisualState((current) => (current === "idle" ? "starting" : current));
      }, 0);

      const loadingTimer = window.setTimeout(() => {
        setVisualState("loading");
      }, 420);

      timersRef.current.push(startTimer, loadingTimer);
      return;
    }

    const stopTimer = window.setTimeout(() => {
      setVisualState((current) => {
        if (current === "idle") {
          return current;
        }

        return "stopping";
      });
    }, 0);

    const idleTimer = window.setTimeout(() => {
      setVisualState("idle");
    }, 420);

    timersRef.current.push(stopTimer, idleTimer);
  }, [busy]);

  const isBusyVisual = visualState !== "idle";
  const className = [
    styles.button,
    disabled ? styles.buttonDisabled : "",
    isBusyVisual ? styles.buttonBusy : "",
    visualState === "starting" ? styles.buttonStarting : "",
    visualState === "loading" ? styles.buttonLoading : "",
    visualState === "stopping" ? styles.buttonStopping : ""
  ]
    .filter(Boolean)
    .join(" ");
  const iconWrapClassName = [
    styles.iconWrap,
    visualState === "starting" ? styles.iconWrapStarting : "",
    visualState === "loading" ? styles.iconWrapLoading : "",
    visualState === "stopping" ? styles.iconWrapStopping : ""
  ]
    .filter(Boolean)
    .join(" ");
  const iconClassName = [styles.icon, isBusyVisual ? styles.iconBusy : ""].filter(Boolean).join(" ");
  const idleLabelClassName = [
    styles.label,
    visualState === "idle" ? styles.labelIdleVisible : styles.labelIdleHidden
  ]
    .filter(Boolean)
    .join(" ");
  const loadingLabelClassName = [
    styles.label,
    isBusyVisual ? styles.labelLoadingVisible : styles.labelLoadingHidden
  ]
    .filter(Boolean)
    .join(" ");
  const dotsClassName = [
    styles.dots,
    isBusyVisual ? styles.dotsVisible : styles.dotsHidden
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} disabled={disabled} onClick={onClick} type={type}>
      <span className={styles.content}>
        <span className={iconWrapClassName}>
          <span className={styles.smoke} aria-hidden="true" />
          <Icon name="rocket_launch" filled className={iconClassName} />
        </span>
        <span className={styles.labelStack}>
          <span className={idleLabelClassName}>Criar projeto</span>
          <span className={loadingLabelClassName}>
            Criando projeto
            <span aria-hidden="true" className={dotsClassName}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
