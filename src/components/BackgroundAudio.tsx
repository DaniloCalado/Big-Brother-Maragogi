"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundAudio({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [label, setLabel] = useState<"idle" | "loading" | "blocked">("idle");
  const [mobileControlsVisible, setMobileControlsVisible] = useState(true);

  const storageKey = "bbm_audio_enabled";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const interval = window.setInterval(() => {
      const el = audioRef.current;
      if (!el) return;
      const playing = !el.paused && !el.ended;
      setMobileControlsVisible(!playing);
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const wantsEnabled = (() => {
      try {
        return localStorage.getItem(storageKey) === "1";
      } catch (_e) {
        void _e;
        return false;
      }
    })();

    const setEnabled = () => {
      try {
        localStorage.setItem(storageKey, "1");
      } catch (_e) {
        void _e;
      }
    };

    const play = async (muted: boolean) => {
      try {
        audio.muted = muted;
        audio.setAttribute("playsinline", "");
        audio.setAttribute("webkit-playsinline", "");
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0.3;
        audio.load();
        await audio.play();
        return true;
      } catch (_e) {
        void _e;
        return false;
      }
    };

    const enableSound = async () => {
      setLabel("loading");
      try {
        audio.setAttribute("playsinline", "");
        audio.setAttribute("webkit-playsinline", "");
      } catch (_e) {
        void _e;
      }

      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.3;
      audio.muted = false;

      if (!audio.paused) {
        setEnabled();
        setVisible(false);
        setLabel("idle");
        return true;
      }

      const okUnmuted = await play(false);
      if (okUnmuted) {
        setEnabled();
        setVisible(false);
        setLabel("idle");
        return true;
      }

      const okMuted = await play(true);
      if (okMuted) {
        try {
          audio.muted = false;
        } catch (_e) {
          void _e;
        }
        setEnabled();
        setVisible(false);
        setLabel("idle");
        return true;
      }

      setLabel("blocked");
      setVisible(true);
      return false;
    };

    const tryAutoplay = async () => {
      const okMuted = await play(true);
      if (!okMuted) {
        setVisible(true);
        return;
      }

      if (wantsEnabled) {
        enableSound();
        return;
      }

      setVisible(true);
    };

    let done = false;
    const onGesture = () => {
      if (done) return;
      done = true;
      enableSound();
    };

    tryAutoplay();

    document.addEventListener("touchstart", onGesture, {
      passive: true,
      once: true,
    });
    document.addEventListener("touchend", onGesture, {
      passive: true,
      once: true,
    });
    document.addEventListener("pointerdown", onGesture, {
      passive: true,
      once: true,
    });
    document.addEventListener("click", onGesture, {
      passive: true,
      once: true,
    });

    return () => {
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("touchend", onGesture);
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("click", onGesture);
    };
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        playsInline
        controls={mobileControlsVisible}
        onPlay={() => setMobileControlsVisible(false)}
        onPlaying={() => setMobileControlsVisible(false)}
        onPointerDown={() => setMobileControlsVisible(false)}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          if (!el.paused && !el.ended) setMobileControlsVisible(false);
        }}
        onPause={() => setMobileControlsVisible(true)}
        onEnded={() => setMobileControlsVisible(true)}
        className={`fixed bottom-4 left-4 z-[9999] w-[280px] md:hidden transition-opacity duration-200 ${
          mobileControlsVisible
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <source src={src} type="audio/mpeg" />
      </audio>
      {visible ? (
        <button
          type="button"
          onClick={() => {
            void (async () => {
              const audio = audioRef.current;
              if (!audio) return;

              setLabel("loading");

              try {
                audio.setAttribute("playsinline", "");
                audio.setAttribute("webkit-playsinline", "");
              } catch (_e) {
                void _e;
              }

              audio.loop = true;
              audio.preload = "auto";
              audio.volume = 0.3;
              audio.muted = false;

              if (!audio.paused) {
                try {
                  localStorage.setItem(storageKey, "1");
                } catch (_e) {
                  void _e;
                }
                setVisible(false);
                setLabel("idle");
                return;
              }

              let ok = false;
              try {
                audio.load();
              } catch (_e) {
                void _e;
              }

              try {
                await audio.play();
                ok = true;
              } catch (_e) {
                void _e;
              }

              if (!ok) {
                try {
                  audio.muted = true;
                  audio.load();
                  await audio.play();
                  audio.muted = false;
                  ok = true;
                } catch (_e) {
                  void _e;
                }
              }

              if (ok) {
                try {
                  localStorage.setItem(storageKey, "1");
                } catch (_e) {
                  void _e;
                }
                setVisible(false);
                setLabel("idle");
              } else {
                setVisible(true);
                setLabel("blocked");
              }
            })();
          }}
          className="fixed bottom-4 right-4 z-[9999] hidden cursor-pointer select-none items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur transition hover:bg-white/10 md:inline-flex"
          aria-label="Ativar som"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          <span>
            {label === "loading"
              ? "Ativando..."
              : label === "blocked"
                ? "Som bloqueado"
                : "Ativar som"}
          </span>
        </button>
      ) : null}
    </>
  );
}
