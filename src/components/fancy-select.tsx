"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { UserOption } from "@/lib/types";
import styles from "./fancy-select.module.css";

export function FancySelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  options: UserOption[];
  placeholder: string;
  disabled?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.gid === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleToggle() {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  const triggerClassName = [
    styles.trigger,
    open ? styles.triggerOpen : "",
    disabled ? styles.triggerDisabled : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.root} ref={containerRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={triggerClassName}
        id={selectId}
        onClick={handleToggle}
        type="button"
      >
        <span className={selectedOption ? styles.value : `${styles.value} ${styles.placeholder}`}>
          {selectedOption?.name ?? placeholder}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          ▾
        </span>
      </button>

      {open ? (
        <div className={styles.menu}>
          <ul aria-labelledby={selectId} className={styles.list} id={listboxId} role="listbox">
            {options.length === 0 ? (
              <li className={styles.empty}>Nenhuma opção disponível.</li>
            ) : (
              options.map((option) => {
                const isSelected = option.gid === value;
                const optionClassName = [
                  styles.option,
                  isSelected ? styles.optionSelected : ""
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li key={option.gid} role="presentation">
                    <button
                      aria-selected={isSelected}
                      className={optionClassName}
                      onClick={() => handleSelect(option.gid)}
                      role="option"
                      type="button"
                    >
                      {option.name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
