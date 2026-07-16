import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Boot } from "./scenes/Boot.ts";
import { Preloader } from "./scenes/Preloader.ts";
import { MainMenu } from "./scenes/MainMenu.ts";
import { Game } from "./scenes/Game.ts";
import { GameOver } from "./scenes/GameOver.ts";

interface SavedLevel {
  id: string;
  name: string;
  elements: any[];
}

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);  
const [wallet, setWallet] = useState(() => Number(localStorage.getItem("devilsrun_wallet") || "0"));  const [level, setLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<"play" | "guide" | "build">("play");
  const [isPaused, setIsPaused] = useState(false);
  
  const [username, setUsername] = useState("Loading");
  const [personalBest, setPersonalBest] = useState(0);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [customLevels, setCustomLevels] = useState<any[]>([]);
  const [loadingCustomLevels, setLoadingCustomLevels] = useState(false);
  const [newLevelName, setNewLevelName] = useState("Crypt of Retribution");
  const [editorElements, setEditorElements] = useState<any[]>([]);
  const [addElementType, setAddElementType] = useState("ground");
  const [localDrafts, setLocalDrafts] = useState<SavedLevel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Terrain" | "Items" | "Hazards" | "Mechanics" | "Troll Traps">("All");
  const [hideEditorUI, setHideEditorUI] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const assetsRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const scrollXRef = useRef(0);
  
  const sandboxDynamicStatesRef = useRef<Record<string, { x: number; vx: number; y: number; vy: number; triggered: boolean; projectiles: Array<{ x: number; y: number; vx: number }> }>>({});
  
  const sandboxPlayerRef = useRef({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    facing: "right" as "left" | "right",
    isGrounded: false,
    jumpsAvailable: 2,
    frame: 0,
    gravityInverted: false,
    controlsInverted: false,
    speedBoosted: false,
    shielded: false,
    controlInversionEnd: 0,
    speedBoostEnd: 0,
    shieldEnd: 0
  });

  const sandboxKeysRef = useRef({ left: false, right: false, jump: false });
  const embersRef = useRef<Array<{ x: number; y: number; speed: number; size: number; alpha: number }>>([]);

  const availableElements = [
    { type: "ground", name: "Themed Stone Slabs", cat: "Terrain" },
    { type: "fake_wall", name: "Illusion Brick Wall", cat: "Terrain" },
    { type: "conveyor_belt", name: "Runic Belt Platform", cat: "Terrain" },
    { type: "portal", name: "Gate Portal", cat: "Goals" },
    { type: "coin", name: "Sacred Relique", cat: "Items" },
    { type: "speed", name: "Hermes Boots Speed", cat: "Items" },
    { type: "shield", name: "Divine Protection Shield", cat: "Items" },
    { type: "spike", name: "Floor Spikes Pit", cat: "Hazards" },
    { type: "rotating_hazard", name: "Spinning Iron Mace", cat: "Hazards" },
    { type: "projectile_launcher", name: "Cursed Pillar Fire", cat: "Hazards" },
    { type: "spike_spawner", name: "Pop Spikes Mechanism", cat: "Hazards" },
    { type: "crusher", name: "Ceiling Crusher Block", cat: "Hazards" },
    { type: "rain_trigger", name: "Falling Sky Spikes", cat: "Hazards" },
    { type: "sawblade", name: "Rolling Sawblade", cat: "Hazards" },
    { type: "spring", name: "Iron Spring Plate", cat: "Mechanics" },
    { type: "trampoline", name: "Mega Trampoline", cat: "Mechanics" },
    { type: "fake_spring", name: "Spiked Mimic Spring", cat: "Mechanics" },
    { type: "falling_block", name: "Falling Grave Brick", cat: "Mechanics" },
    { type: "rising_block", name: "Rising Crypt Slab", cat: "Mechanics" },
    { type: "flickering_tile", name: "Ghostly Slab", cat: "Mechanics" },
    { type: "control_inversion", name: "Dementia Confusion Aura", cat: "Troll Traps" },
    { type: "mimic", name: "Bloodthirsty Mimic", cat: "Troll Traps" },
    { type: "falling_architecture", name: "Collapsing Archway", cat: "Troll Traps" }
  ];

  const filteredElements = selectedCategory === "All" 
    ? availableElements 
    : availableElements.filter(e => e.cat === selectedCategory || (selectedCategory as string) === "Goals" && e.type === "portal");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetWindowInputs = () => {
    const win = window as any;
    win.reactLeftActive = false;
    win.reactRightActive = false;
    win.reactJumpActive = false;
  };

  useEffect(() => {
   const paths = {
      l1_tiles: "l1_tiles.png",
      l1_spike: "l1_spike.png",
      l1_sky: "l1_sky.png",            
      l1_mountain: "l1_mountain.png",  
      l1_hills: "l1_hills.png",        
      coin: "coin_tile.png",
      spring: "spring_tile.png",
      speed: "speed_tile.png",
      shield: "shield_tile.png",
      player_idle: "hero_idle.png",
      player_jump: "hero_jump.png",
      player_run_sheet: "hero_run_sheet.png",
      prop_well: "well_sprite.png",
      prop_column: "column_sprite.png",
      prop_altar: "altar_sprite.png",
      hammer: "hammer.png", 
      sawblade: "sawblade.png",
      trampoline: "trampoline.png",
      fire_ball: "fire_ball.png",
      wizard: "wizard.png",
      mimic: "mimic.png"
    };

    let loadedCount = 0;
    const total = Object.keys(paths).length;

    Object.entries(paths).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
        loadedCount++;
        if (loadedCount === total) {
          setAssetsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total) {
          setAssetsLoaded(true);
        }
      };
    });
  }, []);

  useEffect(() => {
    const defaultGround = [];
    for (let x = 60; x <= 3120; x += 64) {
      defaultGround.push({ type: "ground", x, y: 450 });
    }
    defaultGround.push({ type: "portal", x: 3000, y: 390 });
    setEditorElements(defaultGround);

    const draftsRaw = localStorage.getItem("devilsrun_local_levels");
    if (draftsRaw) {
      try {
        setLocalDrafts(JSON.parse(draftsRaw));
      } catch (e) {}
    }

    const embers = [];
    for (let i = 0; i < 25; i++) {
      embers.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
    embersRef.current = embers;
  }, []);

  useEffect(() => {
    if (activeTab !== "build" || !sandboxCanvasRef.current) return;
    const updateSize = () => {
      const canvas = sandboxCanvasRef.current;
      if (canvas) {
        canvas.width = 540;
        canvas.height = 960;
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "build" || !sandboxCanvasRef.current) return;
    const canvas = sandboxCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    let frameId: number;
    const pState = sandboxPlayerRef.current;

    const killPlayerSandbox = () => {
      if (pState.shielded) {
        pState.shielded = false;
        showToast("SHIELD BROKEN! Damage absorbed.");
        return;
      }
      pState.x = 100;
      pState.y = 300;
      pState.vx = 0;
      pState.vy = 0;
      pState.gravityInverted = false;
      pState.controlsInverted = false;
      pState.speedBoosted = false;
      pState.shielded = false;
      showToast("SACRED TERMINATION: Respawning at Sanctum...");
    };

    const rectsOverlap = (
      r1: { left: number; right: number; top: number; bottom: number },
      r2: { left: number; right: number; top: number; bottom: number }
    ) => {
      return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
    };

    const gameLoop = () => {
      const keys = sandboxKeysRef.current;
      const win = window as any;

      if (pState.controlsInverted && Date.now() > pState.controlInversionEnd) {
        pState.controlsInverted = false;
        showToast("Covenant cured: Control dementia cleared.");
      }
      if (pState.speedBoosted && Date.now() > pState.speedBoostEnd) {
        pState.speedBoosted = false;
      }
      if (pState.shielded && Date.now() > pState.shieldEnd) {
        pState.shielded = false;
      }

      let moveDir = 0;
      const inputLeft = keys.left || win.reactLeftActive;
      const inputRight = keys.right || win.reactRightActive;
      if (inputLeft) moveDir = -1;
      else if (inputRight) moveDir = 1;

      if (pState.controlsInverted) {
        moveDir = -moveDir;
      }

      const currentMaxSpeed = pState.speedBoosted ? 8.2 : 5.5;
      if (moveDir !== 0) {
        pState.vx = moveDir * currentMaxSpeed;
        pState.facing = moveDir < 0 ? "left" : "right";
      } else {
        pState.vx *= 0.82;
        if (Math.abs(pState.vx) < 0.1) pState.vx = 0;
      }

      const gravityDir = pState.gravityInverted ? -1 : 1;
      pState.vy += gravityDir * 0.52;
      
      pState.x += pState.vx;
      pState.y += pState.vy;

      if (pState.x < 30) pState.x = 30;
      if (pState.x > 3200) pState.x = 3200;

      const playerHeight = 44; 
      const playerHalfWidth = 12; 
      const playerRect = {
        left: pState.x - playerHalfWidth,
        right: pState.x + playerHalfWidth,
        top: pState.y - playerHeight,
        bottom: pState.y
      };

      let currentlyGrounded = false;

      editorElements.forEach((el) => {
        if (["ground", "conveyor_belt"].includes(el.type)) {
          const bLeft = el.x - 32;
          const bRight = el.x + 32;
          const bTop = el.y - 32;
          const bBottom = el.y + 32;

          const xOverlap = (pState.x + playerHalfWidth > bLeft) && (pState.x - playerHalfWidth < bRight);
          if (xOverlap) {
            if (!pState.gravityInverted) {
              if (pState.vy >= 0 && pState.y >= bTop && pState.y - pState.vy <= bTop + 8) {
                pState.y = bTop;
                pState.vy = 0;
                currentlyGrounded = true;
                pState.jumpsAvailable = 2;
                if (el.type === "conveyor_belt") {
                  pState.x -= 3.5; 
                }
              }
            } else {
              const playerTop = pState.y - playerHeight;
              if (pState.vy <= 0 && playerTop <= bBottom && playerTop - pState.vy >= bBottom - 8) {
                pState.y = bBottom + playerHeight;
                pState.vy = 0;
                currentlyGrounded = true;
                pState.jumpsAvailable = 2;
                if (el.type === "conveyor_belt") {
                  pState.x -= 3.5;
                }
              }
            }
          }
        }
      });

      pState.isGrounded = currentlyGrounded;

      const wantsJump = keys.jump || win.reactJumpActive;
      if (wantsJump && pState.jumpsAvailable > 0) {
        pState.vy = pState.gravityInverted ? 11.0 : -11.0;
        pState.jumpsAvailable--;
        keys.jump = false;
        win.reactJumpActive = false;
      }

      const hitStaticHazard = editorElements.find((el) => {
        if (!["spike","fake_spring"].includes(el.type)) return false;
        const hazardRect = {
          left: el.x - 18,
          right: el.x + 18,
          top: el.y - 18,
          bottom: el.y + 18
        };
        return rectsOverlap(playerRect, hazardRect);
      });

      if (hitStaticHazard) killPlayerSandbox();

      const spring = editorElements.find((el) => {
        if (!["spring", "trampoline"].includes(el.type)) return false;
        const springRect = {
          left: el.x - 24,
          right: el.x + 24,
          top: el.y - 16,
          bottom: el.y + 16
        };
        return rectsOverlap(playerRect, springRect);
      });

      if (spring) {
        pState.vy = pState.gravityInverted ? 16.5 : -16.5; 
        if (spring.type === "trampoline") pState.vy *= 1.5;
        pState.jumpsAvailable = 2;
      }

      editorElements.forEach((el) => {
        if (Math.abs(pState.x - el.x) < 20 && Math.abs(pState.y - 14 - el.y) < 20) {
          if (el.type === "speed") {
            pState.speedBoosted = true;
            pState.speedBoostEnd = Date.now() + 5000;
            showToast("POWERUP: Hermian Speed Blessing engaged.");
          } else if (el.type === "shield") {
            pState.shielded = true;
            pState.shieldEnd = Date.now() + 8000;
            showToast("POWERUP: Holy Shield Sanctuary activated.");
          }
        }
      });

      const goal = editorElements.find((el) => {
        if (el.type !== "portal") return false;
        const portalRect = {
          left: el.x - 24,
          right: el.x + 24,
          top: el.y - 24,
          bottom: el.y + 24
        };
        return rectsOverlap(playerRect, portalRect);
      });

      if (goal) {
        pState.x = 100;
        pState.y = 300;
        pState.vx = 0;
        pState.vy = 0;
        showToast("SANCTUM SENSORS NORMAL: Portal goal reached.");
      }

      if (pState.y > canvas.height + 100 || pState.y < -100) {
        pState.x = 100;
        pState.y = 300;
        pState.vx = 0;
        pState.vy = 0;
      }

      const targetScroll = pState.x - canvas.width / 2;
      const smoothScroll = scrollXRef.current + (targetScroll - scrollXRef.current) * 0.1;
      scrollXRef.current = Math.max(0, Math.min(2400, smoothScroll));

      ctx.fillStyle = "#050102";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0c0408");
      gradient.addColorStop(1, "#050102");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      embersRef.current.forEach((emb) => {
        emb.y -= emb.speed;
        if (emb.y < -10) {
          emb.y = canvas.height + 10;
          emb.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(127, 29, 29, ${emb.alpha})`;
        ctx.fillRect(emb.x, emb.y, emb.size, emb.size);
      });

      const drawLayer = (img: HTMLImageElement | undefined, factor: number) => {
        if (!img || img.width === 0) return;
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const camX = scrollXRef.current * factor;
        const offsetX = -(camX % drawW);
        const yPos = (canvas.height - drawH) / 2;
        
        ctx.drawImage(img, offsetX, yPos, drawW, drawH);
        ctx.drawImage(img, offsetX + drawW, yPos, drawW, drawH);
      };

      if (assetsLoaded) {
        ctx.globalAlpha = 0.35;
        drawLayer(assetsRef.current.l1_sky, 0.15);
        ctx.globalAlpha = 0.45;
        drawLayer(assetsRef.current.l1_mountain, 0.25);
        ctx.globalAlpha = 0.65;
        drawLayer(assetsRef.current.l1_hills, 0.45);
        ctx.globalAlpha = 1.0;
      }

      ctx.fillStyle = "#450a0a";
      const frontOffset = -(scrollXRef.current * 0.45) % 240;
      for (let i = -1; i < (canvas.width / 240) + 2; i++) {
        const mx = i * 240 + frontOffset;
        ctx.beginPath();
        ctx.moveTo(mx, canvas.height);
        ctx.lineTo(mx + 120, canvas.height - 110);
        ctx.lineTo(mx + 240, canvas.height);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(127, 29, 29, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x - (scrollXRef.current % 64), 0);
        ctx.lineTo(x - (scrollXRef.current % 64), canvas.height);
        ctx.stroke();
      }

     editorElements.forEach((el) => {
        const visualX = el.x - scrollXRef.current;
        if (visualX < -80 || visualX > canvas.width + 80) return;

        const visualY = el.y;
        const key = `${el.type}_${el.x}_${el.y}`;

        if (!sandboxDynamicStatesRef.current[key]) {
          sandboxDynamicStatesRef.current[key] = { x: el.x, y: el.y, vx: 0, vy: 0, triggered: false, projectiles: [] };
        }
        const state = sandboxDynamicStatesRef.current[key];

        const drawGroundBlock = (x: number, y: number, alpha: number = 1.0) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            if (assetsLoaded && assetsRef.current.l1_tiles) {
              const img = assetsRef.current.l1_tiles;
              ctx.drawImage(img, x - 32, y - 32, 64, 64);
            } else {
              ctx.fillStyle = "#450a0a";
              ctx.fillRect(x - 32, y - 32, 64, 64);
            }
            ctx.restore();
        };

        if (el.type === "ground") {
          drawGroundBlock(visualX, visualY);
        } else if (el.type === "fake_wall") {
          drawGroundBlock(visualX, visualY, 0.55);
        } else if (el.type === "conveyor_belt") {
          drawGroundBlock(visualX, visualY);
          ctx.fillStyle = "rgba(88, 28, 135, 0.6)"; 
          ctx.fillRect(visualX - 32, visualY - 32, 64, 64);
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px monospace";
          ctx.fillText("<<<<<", visualX - 18, visualY + 4);
        } else if (el.type === "falling_block") {
          if (!state.triggered && Math.abs(pState.x - el.x) < 100 && pState.y > state.y) state.triggered = true;
          if (state.triggered) {
            state.vy += 0.35;
            state.y += state.vy;
          }
          drawGroundBlock(visualX, state.y);
          if (state.triggered && Math.abs(pState.x - el.x) < 25 && Math.abs(pState.y - 14 - state.y) < 20) killPlayerSandbox();
        } else if (el.type === "rising_block") {
          if (!state.triggered && Math.abs(pState.x - el.x) < 80 && pState.y < state.y) state.triggered = true;
          if (state.triggered) {
            state.vy = -6.0;
            state.y += state.vy;
          }
          drawGroundBlock(visualX, state.y);
          if (state.triggered && Math.abs(pState.x - el.x) < 25 && Math.abs(pState.y - 14 - state.y) < 20) killPlayerSandbox();
        } else if (el.type === "crusher") {
          if (!state.triggered && Math.abs(pState.x - el.x) < 60 && pState.y > state.y) state.triggered = true;
          if (state.triggered) {
            if (state.vy >= 0 && state.y < el.y + 110) state.vy = 8.5; 
            else state.vy = -1.2; 
            state.y += state.vy;
            if (state.y <= el.y) { state.y = el.y; state.vy = 0; state.triggered = false; }
          }
          drawGroundBlock(visualX, state.y); 
          if (Math.abs(pState.x - el.x) < 25 && Math.abs(pState.y - 14 - state.y) < 32) killPlayerSandbox();
        } else if (el.type === "projectile_launcher") {
          if (Math.floor(Date.now() / 2000) % 2 === 0 && !state.triggered) {
            state.projectiles.push({ x: el.x - 22, y: el.y, vx: -6.5 });
            state.triggered = true;
          } else if (Math.floor(Date.now() / 2000) % 2 !== 0) {
            state.triggered = false;
          }
          
          if (assetsLoaded && assetsRef.current.wizard) {
             const img = assetsRef.current.wizard;
             const fw = img.width / 10; 
             const fh = img.height / 2; 
             const fIdx = Math.floor((Date.now() / 150) % 10);
             ctx.drawImage(img, fIdx * fw, 0, fw, fh, visualX - 40, visualY - 56, 80, 80);
          } else {
             ctx.fillStyle = "#450a0a";
             ctx.fillRect(visualX - 16, visualY - 32, 32, 64);
          }

          state.projectiles.forEach((p) => {
            p.x += p.vx;
            if (assetsLoaded && assetsRef.current.fire_ball) {
               const img = assetsRef.current.fire_ball;
               const fw = img.width / 3; 
               const fIdx = Math.floor((Date.now() / 100) % 3);
               ctx.drawImage(img, fIdx * fw, 0, fw, img.height, p.x - scrollXRef.current - 20, p.y - 20, 40, 40);
            } else {
               ctx.fillStyle = "#f97316";
               ctx.beginPath(); ctx.arc(p.x - scrollXRef.current, p.y, 10, 0, Math.PI * 2); ctx.fill();
            }
            if (Math.abs(pState.x - p.x) < 14 && Math.abs(pState.y - 14 - p.y) < 14) killPlayerSandbox();
          });
          state.projectiles = state.projectiles.filter((p) => p.x > el.x - 600);
        } else if (el.type === "spike") {
          const tex = assetsRef.current.l1_spike;
          if (tex) ctx.drawImage(tex, visualX - 24, visualY - 24, 48, 48);
        } else if (el.type === "coin") {
          const tex = assetsRef.current.coin;
          if (tex) ctx.drawImage(tex, visualX - 16, visualY - 16, 32, 32);
        } else if (el.type === "spring" || el.type === "fake_spring") {
          const tex = assetsRef.current.spring;
          if (tex) ctx.drawImage(tex, visualX - 24, visualY - 16, 48, 32);
          if (el.type === "fake_spring") {
            ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
            ctx.fillRect(visualX - 24, visualY - 16, 48, 32);
          }
        } else if (el.type === "trampoline") {
          const tex = assetsRef.current.trampoline;
          if (tex) ctx.drawImage(tex, visualX - 32, visualY - 16, 64, 32);
        } else if (el.type === "portal") {
          const tex = assetsRef.current.shield;
          if (tex) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.drawImage(tex, visualX - 24, visualY - 24, 48, 48);
            ctx.restore();
          }
        } else if (el.type === "speed") {
          const tex = assetsRef.current.speed;
          if (tex) ctx.drawImage(tex, visualX - 16, visualY - 16, 32, 32);
        } else if (el.type === "shield") {
          const tex = assetsRef.current.shield;
          if (tex) ctx.drawImage(tex, visualX - 16, visualY - 16, 32, 32);
        } else if (el.type === "sawblade") {
          ctx.save();
          ctx.translate(visualX, visualY);
          const spinAngle = (Date.now() / 150) * Math.PI * 2;
          ctx.rotate(spinAngle);
          
          if (assetsLoaded && assetsRef.current.sawblade) {
             ctx.drawImage(assetsRef.current.sawblade, -32, -32, 64, 64); 
          } else {
             ctx.fillStyle = "#7f1d1d";
             ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); 
          }
          ctx.restore();
       } else if (el.type === "rotating_hazard") {
          ctx.save();
          const time = Date.now();
          const orbitAngle = (time / 6) % 360;
          const orbitRad = orbitAngle * (Math.PI / 180);
          
          const radius = el.width || 120;
          const currentX = visualX + Math.cos(orbitRad) * radius;
          const currentY = visualY + Math.sin(orbitRad) * radius;

          const worldHazardX = el.x + Math.cos(orbitRad) * radius;
          const worldHazardY = el.y + Math.sin(orbitRad) * radius;
          if (Math.abs(pState.x - worldHazardX) < 24 && Math.abs(pState.y - 14 - worldHazardY) < 24) {
             killPlayerSandbox();
          }

          ctx.translate(currentX, currentY);
          
          const spinAngle = (time / 800) * Math.PI * 2;
          ctx.rotate(spinAngle);
          
          if (assetsLoaded && assetsRef.current.hammer) {
             ctx.drawImage(assetsRef.current.hammer, -16, -32, 32, 64); 
          } else {
             ctx.fillStyle = "#7f1d1d";
             ctx.fillRect(-16, -32, 32, 64); 
          }
          ctx.restore();
        } else if (el.type === "flickering_tile") {
          const visible = Math.floor(Date.now() / 1500) % 2 === 0;
          drawGroundBlock(visualX, visualY, visible ? 1.0 : 0.2);
        } else if (["control_inversion", "ui_troll"].includes(el.type)) {
          if (assetsLoaded && assetsRef.current.fire_ball) {
             ctx.drawImage(assetsRef.current.fire_ball, visualX - 16, visualY - 16, 32, 32);
          } else {
             ctx.fillStyle = "#8b5cf6";
             ctx.beginPath(); ctx.arc(visualX, visualY, 15, 0, Math.PI * 2); ctx.fill();
          }
          
          if (el.type === "control_inversion" && Math.abs(pState.x - el.x) < 25 && Math.abs(pState.y - el.y) < 25 && !pState.controlsInverted) {
            pState.controlsInverted = true;
            pState.controlInversionEnd = Date.now() + 4000;
            showToast("MUTATOR: Dementia aura inversion triggered.");
          } else {
            state.triggered = false;
          }
        } else if (el.type === "developer_door") {
          if (assetsLoaded && assetsRef.current.prop_altar) {
             ctx.drawImage(assetsRef.current.prop_altar, visualX - 24, visualY - 32, 48, 64);
          } else {
             ctx.fillStyle = "#1e1b4b"; 
             ctx.fillRect(visualX - 24, visualY - 32, 48, 64);
          }
          if (Math.abs(pState.x - el.x) < 120 && pState.y > el.y - 50) state.triggered = true;
          if (state.triggered) { el.x += 4.0; }
        } else if (el.type === "falling_architecture") {
          drawGroundBlock(visualX, visualY);
          if (!state.triggered && Math.abs(pState.x - el.x) < 80 && pState.y > el.y - 30) state.triggered = true;
          if (state.triggered) {
            state.vy += 0.4;
            state.y += state.vy;
          }
          if (state.triggered && Math.abs(pState.x - el.x) < 20 && Math.abs(pState.y - 14 - state.y) < 30) killPlayerSandbox();
        } else if (el.type === "mimic") {
          
          if (!state.triggered && Math.abs(pState.x - el.x) < 55 && pState.y > el.y - 80) {
            state.triggered = true;
            state.vx = -4.5;
            state.vy = -8.0;
            state.x = el.x;
          }
          
          if (state.triggered) {
            state.vy += 0.4; // Gravity
            state.y += state.vy;
            state.x += state.vx; // Chase player
            
            // Floor bouncing
            if (state.y > el.y) {
              state.y = el.y;
              state.vy = -6.0; 
            }
          } else {
            state.y = el.y;
            state.x = el.x;
          }
          
          const drawX = state.x - scrollXRef.current;
          if (assetsLoaded && assetsRef.current.mimic) {
             ctx.save();
             if (state.triggered) ctx.filter = 'sepia(100%) hue-rotate(-50deg) saturate(300%)'; 
             ctx.drawImage(assetsRef.current.mimic, drawX - 24, state.y - 24, 48, 48);
             ctx.restore();
          } else {
             ctx.fillStyle = state.triggered ? "#ef4444" : "#f59e0b";
             ctx.fillRect(drawX - 24, state.y - 24, 48, 48);
          }
          
          if (state.triggered && Math.abs(pState.x - state.x) < 24 && Math.abs(pState.y - 14 - state.y) < 24) {
             killPlayerSandbox();
          }
        }
        
        
        else {
          ctx.fillStyle = "#581c87";
          ctx.fillRect(visualX - 24, visualY - 24, 48, 48);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px monospace";
          const abbr = el.type.slice(0, 10).toUpperCase();
          ctx.fillText(abbr, visualX - 20, visualY + 4);
        }
      });

      if (assetsLoaded && assetsRef.current.player_idle) {
        ctx.save();
        const playerScreenX = pState.x - scrollXRef.current;
        const playerScreenY = pState.y; 
        
        ctx.translate(playerScreenX, playerScreenY);
        if (pState.facing === "left") ctx.scale(-1, 1);
        if (pState.gravityInverted) ctx.scale(1, -1);
        
        if (!pState.isGrounded && assetsRef.current.player_jump) {
            const img = assetsRef.current.player_jump;
            const fw = 160; const fh = 90; 
            ctx.drawImage(img, 1 * fw, 0, fw, fh, -128, -144, 256, 144);
        } else if (Math.abs(pState.vx) > 0.5 && assetsRef.current.player_run_sheet) {
            const img = assetsRef.current.player_run_sheet;
            const fw = 160; const fh = 90; 
            const frames = Math.floor(img.width / fw) || 8;
            pState.frame = (pState.frame + 1) % (frames * 6);
            const frameIdx = Math.floor(pState.frame / 6); 
            ctx.drawImage(img, frameIdx * fw, 0, fw, fh, -128, -144, 256, 144);
        } else if (assetsRef.current.player_idle) {
            const img = assetsRef.current.player_idle;
            const fw = 160; const fh = 90; 
            const frames = Math.floor(img.width / fw) || 10;
            pState.frame = (pState.frame + 1) % (frames * 6);
            const frameIdx = Math.floor(pState.frame / 6); 
            ctx.drawImage(img, frameIdx * fw, 0, fw, fh, -128, -144, 256, 144);
        }
        
        if (pState.shielded) {
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -24, 28, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (pState.speedBoosted) {
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, -24, 24, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(pState.x - scrollXRef.current - 6, pState.y - 28, 12, 28);
      }

      frameId = requestAnimationFrame(gameLoop);
    };

    frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [activeTab, editorElements, assetsLoaded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "build") return;
      if (e.key === "a" || e.key === "ArrowLeft") sandboxKeysRef.current.left = true;
      if (e.key === "d" || e.key === "ArrowRight") sandboxKeysRef.current.right = true;
      if (e.key === " " || e.key === "w" || e.key === "ArrowUp") sandboxKeysRef.current.jump = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (activeTab !== "build") return;
      if (e.key === "a" || e.key === "ArrowLeft") sandboxKeysRef.current.left = false;
      if (e.key === "d" || e.key === "ArrowRight") sandboxKeysRef.current.right = false;
      if (e.key === " " || e.key === "w" || e.key === "ArrowUp") sandboxKeysRef.current.jump = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTab]);

  // load stats
  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/me?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.wallet !== undefined) setWallet(data.wallet);
          if (data.allTimeBest) setPersonalBest(data.allTimeBest);
          return data;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err);
    }
  };

  useEffect(() => {
    const initUser = async () => {
      const data = await fetchUserProfile();
      if (data && data.name) {
        setUsername(data.name.replace("u/", ""));
      } else {
        setUsername("Anonymous");
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    const handleGameScore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setScore(detail.score);
        setCoins(detail.coins);
        if (detail.level) setLevel(detail.level);
      }
    };

    const handleGameOver = () => { 
      setIsPlaying(false); 
      resetWindowInputs(); 
      setTimeout(() => {
        fetchUserProfile();
      }, 1000);
    };
    
    const handleGameStart = () => { 
      setScore(0); 
      setCoins(0); 
      setLevel(1); 
      setIsPlaying(false); 
      resetWindowInputs(); 
      fetchUserProfile(); 
    };
    const handleActiveGameStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsPlaying(true); setScore(0); setCoins(0);
      if (detail && detail.level) setLevel(detail.level);
      resetWindowInputs();
    };

    const handleCustomLevelBeat = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      showToast(`[VICTORY] Descents cleared: ${detail?.name || "Level"}!`);
      setActiveTab("play"); setIsPlaying(false); resetWindowInputs();
    };

    const handleCampaignVictory = () => {
      showToast("[CHAMPION] Conquered all sacred zones!");
      setActiveTab("play"); setIsPlaying(false); resetWindowInputs();
    };

    window.addEventListener("game-score", handleGameScore);
    window.addEventListener("game-over", handleGameOver);
    window.addEventListener("game-start", handleGameStart);
    window.addEventListener("active-game-start", handleActiveGameStart);
    window.addEventListener("custom-level-beat", handleCustomLevelBeat);
    window.addEventListener("campaign-victory", handleCampaignVictory);

    return () => {
      window.removeEventListener("game-score", handleGameScore);
      window.removeEventListener("game-over", handleGameOver);
      window.removeEventListener("game-start", handleGameStart);
      window.removeEventListener("active-game-start", handleActiveGameStart);
      window.removeEventListener("custom-level-beat", handleCustomLevelBeat);
      window.removeEventListener("campaign-victory", handleCampaignVictory);
    };
  }, []);

  useEffect(() => {
   const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 540, 
      height: 960, 
      parent: "game-container",
      backgroundColor: "#050102",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false }
      },
      scale: {
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: true,
        antialias: false,
        antialiasGL: false,
        roundPixels: true,
        clearBeforeRender: true
      },
      audio: { noAudio: true },
      scene: [Boot, Preloader, MainMenu, Game, GameOver]
    };

    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const fetchCustomLevels = async () => {
    setLoadingCustomLevels(true);
    try {
      const res = await fetch(`/api/custom-levels?t=${Date.now()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomLevels(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setCustomLevels([]);
    } finally {
      setLoadingCustomLevels(false);
    }
  };

  const handleTabClick = (tab: "play" | "guide" | "build") => {
    setActiveTab(tab);
    resetWindowInputs();
    setWallet(Number(localStorage.getItem("devilsrun_wallet") || "0"));
    if (tab === "build") {
      fetchCustomLevels();
    }
  };
  const handlePauseToggle = () => {
    const activeGameScene = gameRef.current?.scene.getScene("Game");
    if (!activeGameScene || !activeGameScene.scene.isActive()) {
      showToast("Begin your descent run before pausing!");
      return;
    }

    if (isPaused) {
      gameRef.current?.scene.scenes.forEach((s) => s.scene.resume());
      setIsPaused(false);
    } else {
      gameRef.current?.scene.scenes.forEach((s) => s.scene.pause());
      setIsPaused(true);
    }
  };

  const handlePauseRestart = () => {
    setIsPaused(false);
    resetWindowInputs();
    gameRef.current?.scene.scenes.forEach((s) => s.scene.resume());
    window.dispatchEvent(new CustomEvent("trigger-restart"));
  };

  const saveDraftLocally = (elements: any[], name: string) => {
    const drafts = [...localDrafts];
    const existingIndex = drafts.findIndex((d) => d.name === name);
    if (existingIndex !== -1) {
      drafts[existingIndex].elements = elements;
    } else {
      drafts.push({ id: `draft_${Date.now()}`, name: name, elements: elements });
    }
    localStorage.setItem("devilsrun_local_levels", JSON.stringify(drafts));
    setLocalDrafts(drafts);
  };

  const deleteDraftLocally = (id: string) => {
    const filtered = localDrafts.filter((d) => d.id !== id);
    localStorage.setItem("devilsrun_local_levels", JSON.stringify(filtered));
    setLocalDrafts(filtered);
    showToast("Sacred Blueprint blueprint deleted.");
  };

  const toggleEditorGridSlot = (colX: number, rowY: number) => {
    const index = editorElements.findIndex((e) => e.x === colX && e.y === rowY);
    let updated = [...editorElements];

    if (index !== -1) {
      if (editorElements[index].type === addElementType) {
        updated = updated.filter((_, k) => k !== index);
        setEditorElements(updated);
        showToast("Cleared slot block");
      } else {
        updated[index] = { type: addElementType, x: colX, y: rowY };
        setEditorElements(updated);
        showToast(`Carved ${addElementType.toUpperCase()}`);
      }
    } else {
      updated.push({ type: addElementType, x: colX, y: rowY });
      setEditorElements(updated);
      showToast(`Carved ${addElementType.toUpperCase()}`);
    }
    saveDraftLocally(updated, newLevelName);
  };

  const getElementPreviewStyle = (type: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    width: "24px",
    height: "24px",
    imageRendering: "pixelated",
    backgroundSize: "100% 100%", 
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center"
  };

  switch (type) {
    case "ground":
    case "falling_block":
    case "rising_block":
    case "falling_architecture":
      return { ...baseStyle, backgroundImage: "url(l1_tiles.png)", backgroundSize: "100% 100%" };
    case "fake_wall":
      return { ...baseStyle, backgroundImage: "url(l1_tiles.png)", opacity: 0.5 };
    case "conveyor_belt":
      return { ...baseStyle, backgroundImage: "url(l1_tiles.png)", borderBottom: "2px solid #581c87" };
    case "flickering_tile":
      return { ...baseStyle, backgroundImage: "url(l1_tiles.png)", opacity: 0.5, borderStyle: "dashed" };
    case "spike":
    case "spike_spawner":
    case "rain_trigger":
      return { ...baseStyle, backgroundImage: "url(l1_spike.png)" };
    case "coin":
      return { ...baseStyle, backgroundImage: "url(coin_tile.png)" };
    case "spring":
    case "fake_spring":
      return { ...baseStyle, backgroundImage: "url(spring_tile.png)" };
    case "trampoline":
      return { ...baseStyle, backgroundImage: "url(trampoline.png)" };
    case "speed":
      return { ...baseStyle, backgroundImage: "url(speed_tile.png)" };
    case "shield":
    case "portal":
      return { ...baseStyle, backgroundImage: "url(door.png)" }; // Now uses the Reaper
    case "mimic":
      return { ...baseStyle, backgroundImage: "url(mimic.png)" };
    case "rotating_hazard":
    case "crusher":
      return { ...baseStyle, backgroundImage: "url(hammer.png)" };
    case "sawblade":
      return { ...baseStyle, backgroundImage: "url(sawblade.png)" };
    case "projectile_launcher":
      return { ...baseStyle, backgroundImage: "url(wizard.png)" };
    case "developer_door":
      return { ...baseStyle, backgroundImage: "url(door.png)" };
    default:
      return { ...baseStyle, backgroundImage: "url(fire_ball.png)" };
    }
  };

  return (
    <div id="app-shell" className="select-none flex flex-col w-full h-screen relative bg-[#050102] text-zinc-200 overflow-hidden">
      
      <style>{`
        .scanline-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.35) 50%
          );
          background-size: 100% 4px;
          z-index: 45;
          pointer-events: none;
        }

        .screen-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, transparent 45%, rgba(6,1,3,0.92) 100%);
          z-index: 46;
          pointer-events: none;
        }

        .ember-pixel {
          position: absolute;
          width: 3px;
          height: 3px;
          background-color: #7f1d1d;
          opacity: 0.35;
          animation: floatUp 6s infinite linear;
          pointer-events: none;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(105vh) translateX(0) scale(1);
            opacity: 0;
          }
          10% { opacity: 0.45; }
          90% { opacity: 0.45; }
          100% {
            transform: translateY(-5vh) translateX(45px) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <div className="ember-pixel" style={{ left: "10%", animationDelay: "0s", animationDuration: "5s" }} />
        <div className="ember-pixel" style={{ left: "28%", animationDelay: "1.5s", animationDuration: "7s", backgroundColor: "#b91c1c" }} />
        <div className="ember-pixel" style={{ left: "45%", animationDelay: "0.5s", animationDuration: "6s", backgroundColor: "#581c87" }} />
        <div className="ember-pixel" style={{ left: "62%", animationDelay: "3s", animationDuration: "8s" }} />
        <div className="ember-pixel" style={{ left: "79%", animationDelay: "2.2s", animationDuration: "5.5s", backgroundColor: "#78350f" }} />
      </div>

      <header className="w-full px-4 py-3 flex justify-between items-center z-50 bg-[#0c0408]/95 border-b-2 border-red-900 shadow-[0_5px_20px_rgba(127,29,29,0.3)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-700 animate-pulse shadow-[0_0_12px_#7f1d1d]" />
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none">DEVIL'S RUN</span>
            <span className="font-sans text-[11px] font-black text-red-700 uppercase tracking-wider mt-0.5 leading-none">
              {isPlaying ? (
                level === 1 ? "ZONE I: CEMETERY" :
                level === 2 ? "ZONE II: CHURCH" :
                level === 3 ? "ZONE III: OLD TOWN" :
                "ZONE IV: JUNK WASTELAND"
              ) : "STBY"}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-red-950/40 shadow-inner">
          {(["play", "build", "guide"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-3.5 py-1.5 text-[9px] sm:text-[10px] font-black font-mono rounded-md cursor-pointer transition-all ${
                activeTab === tab 
                  ? "bg-gradient-to-r from-red-900 to-purple-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.4)] border border-red-500/25" 
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={handlePauseRestart}
              className="px-3 py-1 bg-red-950/50 hover:bg-red-850 border-2 border-red-900 rounded-md text-[8.5px] font-mono font-bold text-red-400 hover:text-white transition-all cursor-pointer shadow-[0_0_10px_rgba(127,29,29,0.2)] animate-pulse"
            >
              RESET
            </button>
          )}
          <button
            className="p-1.5 text-red-700 hover:text-white text-[11px] font-mono cursor-pointer transition-all hover:scale-110"
            onClick={handlePauseToggle}
          >
            ||
          </button>
        </div>
      </header>

      {isPlaying && activeTab === "play" && (
        <div className="absolute top-[68px] left-0 right-0 px-4 py-2 pointer-events-none z-30 flex justify-between font-mono">
          <div className="bg-[#0c0408]/95 border-2 border-red-900 px-4 py-2 rounded-lg backdrop-blur-md flex flex-col pointer-events-auto shadow-[0_5px_15px_rgba(127,29,29,0.25)]">
            <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">DEPTH SCRIBED</span>
            <span className="text-[14px] text-white font-black tracking-wider mt-0.5">{score}M</span>
          </div>

          <div className="bg-[#0c0408]/95 border-2 border-purple-900 px-4 py-2 rounded-lg backdrop-blur-md flex flex-col pointer-events-auto shadow-[0_5px_15px_rgba(88,28,135,0.25)]">
            <span className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">SACRED RELIQUES</span>
            <span className="text-[14px] text-purple-400 font-black tracking-wider mt-0.5">{coins}</span>
          </div>
        </div>
      )}

      <div 
        id="game-stage-wrapper" 
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden bg-zinc-950" 
        style={{ display: activeTab === "build" ? "none" : "flex" }}
      >
        <div className="absolute inset-0 bg-[#050102]/85 backdrop-blur-md pointer-events-none z-0" />

        <div 
          id="game-container" 
          className="w-full h-full shadow-[0_0_80px_rgba(127,29,29,0.45)] relative z-10 self-center"
        ></div>

        {isPlaying && activeTab === "play" && (
         <div className="absolute bottom-4 left-0 right-0 w-full pointer-events-none z-50 px-6">
            <div className="relative w-full h-32 flex justify-between items-end max-w-3xl mx-auto pb-2">
              
              <div className="flex gap-4 pointer-events-auto">
                <button
                  onMouseDown={() => { (window as any).reactLeftActive = true; }}
                  onMouseUp={() => { (window as any).reactLeftActive = false; }}
                  onMouseLeave={() => { (window as any).reactLeftActive = false; }}
                  onTouchStart={(e) => { e.preventDefault(); (window as any).reactLeftActive = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); (window as any).reactLeftActive = false; }}
                  className="w-20 h-20 bg-zinc-950/40 border-2 border-white/20 rounded-full flex items-center justify-center text-white/70 text-3xl font-black shadow-lg active:bg-red-600/60 active:scale-95 cursor-pointer backdrop-blur-md transition-all"
                >
                  ◀
                </button>
                <button
                  onMouseDown={() => { (window as any).reactRightActive = true; }}
                  onMouseUp={() => { (window as any).reactRightActive = false; }}
                  onMouseLeave={() => { (window as any).reactRightActive = false; }}
                  onTouchStart={(e) => { e.preventDefault(); (window as any).reactRightActive = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); (window as any).reactRightActive = false; }}
                  className="w-20 h-20 bg-zinc-950/40 border-2 border-white/20 rounded-full flex items-center justify-center text-white/70 text-3xl font-black shadow-lg active:bg-red-600/60 active:scale-95 cursor-pointer backdrop-blur-md transition-all"
                >
                  ▶
                </button>
              </div>

              <div className="pointer-events-auto">
                <button
                  onMouseDown={() => { (window as any).reactJumpActive = true; }}
                  onMouseUp={() => { (window as any).reactJumpActive = false; }}
                  onMouseLeave={() => { (window as any).reactJumpActive = false; }}
                  onTouchStart={(e) => { e.preventDefault(); (window as any).reactJumpActive = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); (window as any).reactJumpActive = false; }}
                  className="w-24 h-24 bg-zinc-950/40 border-2 border-white/20 rounded-full flex flex-col items-center justify-center text-white/70 font-black shadow-lg active:bg-red-600/60 active:scale-95 cursor-pointer backdrop-blur-md transition-all"
                >
                  <span className="text-4xl leading-none -mt-2">▲</span>
                  <span className="text-[10px] font-mono font-bold tracking-widest mt-1 opacity-80">JUMP</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {activeTab === "guide" && (
        <div className="devvit-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h2>COVENANT COGNITION</h2>
              <button className="modal-close-btn" onClick={() => setActiveTab("play")}>×</button>
            </div>
            <div className="modal-body font-mono text-[11px] leading-relaxed">
              <p className="text-zinc-400 mb-4 uppercase text-center">[SACRED COVENANT REGIME]</p>
              
              <div className="flex flex-col gap-2 bg-zinc-950 p-2.5 rounded-lg border-2 border-red-900 shadow-inner">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-red-500 font-bold">A / LEFT ARROW</span>
                  <span className="text-zinc-400">DESCENT LEFT</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-red-500 font-bold">D / RIGHT ARROW</span>
                  <span className="text-zinc-400">DESCENT RIGHT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-bold">SPACE / W / UP</span>
                  <span className="text-zinc-400">DOUBLE JUMP COMMENCED</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-red-500 font-bold uppercase mb-1">MUTATIONS</p>
                <p className="text-zinc-400 leading-normal mb-2">HOLY SHIELDS RESIST ONE INFERNAL STRIKE SECURELY. COMMENCE PREVIEWS OF INTENSE SEGMENTS.</p>
                <p className="text-zinc-400 leading-normal">WING BLADE BOOTS BOOST MOVEMENT ACCELERATION BY 50 PERCENT.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="devvit-btn-primary w-full" onClick={() => setActiveTab("play")}>ENGAGE COVENANT</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "build" && (
        <div className="flex-1 w-full relative z-30 flex flex-col overflow-hidden bg-zinc-950">
          
         <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
            <canvas
              ref={sandboxCanvasRef}
              className="cursor-crosshair block shadow-[0_0_80px_rgba(127,29,29,0.45)] pointer-events-auto bg-[#050102]"
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "100vw",
                maxHeight: "100dvh",
                aspectRatio: "540 / 960",
                objectFit: "contain"
              }}
              onClick={(e) => {
                if (!sandboxCanvasRef.current) return;
                const canvas = sandboxCanvasRef.current;
                const rect = canvas.getBoundingClientRect();
                
                // coordinate scaling
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;

                const worldX = clickX + scrollXRef.current;
                
                const gridX = Math.round(worldX / 64) * 64;
                const gridY = Math.round(clickY / 32) * 32;

                toggleEditorGridSlot(gridX, gridY);
              }}
            />
          </div>

          <div className={`absolute top-20 left-4 z-40 transition-all ${hideEditorUI ? "opacity-0 pointer-events-none -translate-x-12" : "opacity-100"}`}>
            <div className="w-72 bg-[#090406]/95 border-2 border-red-500 rounded-xl p-4 shadow-[0_10px_40px_rgba(239,68,68,0.25)] backdrop-blur-md flex flex-col gap-3">
              <div>
                <span className="text-[8px] font-mono text-red-500 font-extrabold uppercase tracking-widest block mb-1">BLUEPRINT CONFIG</span>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-red-500 shadow-inner"
                  maxLength={24}
                />
              </div>

              {/* DYNAMIC BLUEPRINT COST CALCULATOR */}
              <div className="flex flex-col gap-1.5 mt-1">
                {(() => {
                  const premiumCount = editorElements.filter(el => !["ground", "portal", "coin"].includes(el.type)).length;
                  const totalCost = 1000 + (premiumCount * 50);
                  const canAfford = wallet >= totalCost; 

                  return (
                    <>
                      <div className="flex justify-between items-center bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1.5">
                        <span className="text-[8px] font-mono text-purple-400 font-bold">WALLET: {wallet} 🪙</span>
                        <span className="text-[8px] font-mono text-zinc-400 font-bold">BASE FEE: 1000 🪙</span>
                      </div>
                      
                      <div className="flex gap-2 items-stretch">
                        <button
                          onClick={async () => {
                            if (editorElements.length === 0) {
                              showToast("Draw design configurations first!");
                              return;
                            }
                            
                            
                            const currentWallet = Number(localStorage.getItem("devilsrun_wallet") || "0");
                            if (currentWallet < totalCost) {
                              showToast(`Insufficient Reliques! You need ${totalCost}.`);
                              return;
                            }
                            
                            try {
                              const res = await fetch("/api/custom-levels", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newLevelName, elements: editorElements })
                              });
                              if (res.ok) {
                                showToast("[SUCCESS] Published level & Post created!");
                              
                                const newWallet = currentWallet - totalCost;
                                localStorage.setItem("devilsrun_wallet", newWallet.toString());
                                setWallet(newWallet);
                                fetchCustomLevels();
                              } else {
                                showToast(`Failed: Need ${totalCost} Reliques!`);
                              }
                            } catch (err) {
                              showToast("Database publish fault.");
                            }
                          }}
                          className={`flex-1 flex justify-between items-center px-3 border text-white font-mono text-[9px] font-black py-2 rounded uppercase tracking-wider transition-all shadow-md ${canAfford ? "bg-gradient-to-r from-green-600 to-emerald-500 border-white/20 hover:brightness-110 cursor-pointer" : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"}`}
                        >
                          <span>PUBLISH RUN</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] ${canAfford ? 'bg-black/30 text-white' : 'bg-black/20 text-red-400'}`}>
                            COST: {totalCost}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => {
                            const cleanLayout = [];
                            for (let x = 60; x <= 3000; x += 60) {
                              cleanLayout.push({ type: "ground", x, y: 450 });
                            }
                            cleanLayout.push({ type: "portal", x: 2940, y: 390 });
                            setEditorElements(cleanLayout);
                            showToast("Level floor reset.");
                          }}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 font-mono text-[9px] font-extrabold px-3 py-2 rounded uppercase transition-colors cursor-pointer"
                        >
                          RESET
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-zinc-900 pt-2 flex flex-wrap gap-1">
                {(["All", "Terrain", "Items", "Hazards", "Mechanics", "Troll Traps"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[7.5px] font-mono font-bold transition-all ${selectedCategory === cat ? "bg-red-500 text-white border border-white/20 shadow-[0_0_8px_rgba(239,68,68,0.35)]" : "bg-zinc-900/40 text-zinc-500 hover:text-zinc-200"}`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="max-h-24 overflow-y-auto pr-1 flex flex-col gap-1">
                {filteredElements.map((el) => {
                  const isSelected = addElementType === el.type;
                  // Calculate cost: 0 for basics, 50 for traps
                  const isFree = ["ground", "portal", "coin"].includes(el.type);
                  const costText = isFree ? "FREE" : "50 🪙";
                  
                  return (
                    <button
                      key={el.type}
                      onClick={() => setAddElementType(el.type)}
                      className={`w-full p-1.5 rounded border transition-all text-left flex items-center justify-between cursor-pointer ${isSelected ? "border-red-500 bg-red-950/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]" : "border-zinc-900 bg-zinc-950/20 hover:border-zinc-800"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div style={getElementPreviewStyle(el.type)} />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono font-bold text-white uppercase tracking-tight">{el.name}</span>
                          <span className={`text-[7px] font-mono font-bold mt-0.5 ${isFree ? 'text-green-400' : 'text-purple-400'}`}>COST: {costText}</span>
                        </div>
                      </div>
                      <span className="text-[6.5px] font-mono text-zinc-500 uppercase">{el.cat}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-zinc-900 pt-2 flex flex-col gap-2 max-h-36 overflow-y-auto">
                <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase">SAVED BLUEPRINTS</span>
                {localDrafts.length === 0 ? (
                  <span className="text-[7.5px] text-zinc-600 font-mono">No drafts on device</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    {localDrafts.map(draft => (
                      <div key={draft.id} className="p-1.5 border border-zinc-900 rounded bg-[#03060a]/50 flex justify-between items-center gap-1.5">
                        <span className="text-[8px] font-extrabold truncate flex-1 text-white">{draft.name}</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setNewLevelName(draft.name);
                              setEditorElements(draft.elements);
                              showToast(`Loaded draft: ${draft.name}`);
                            }}
                            className="text-[6.5px] font-mono text-cyan-400 hover:underline cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => deleteDraftLocally(draft.id)}
                            className="text-[6.5px] font-mono text-red-500 hover:underline cursor-pointer"
                          >
                            DELETE
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab("play");
                              setTimeout(() => {
                                const activeGameScene = gameRef.current?.scene.getScene("Game");
                                if (activeGameScene) {
                                  activeGameScene.scene.start("Game", { customLevel: draft });
                                }
                              }, 150);
                            }}
                            className="text-[6.5px] font-mono text-yellow-400 hover:underline cursor-pointer"
                          >
                            RUN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute top-20 right-4 z-40">
            <button
              onClick={() => setHideEditorUI(!hideEditorUI)}
              className="px-3 py-1.5 bg-[#030102]/95 border-2 border-red-500 rounded-lg text-[8px] font-mono font-bold text-red-400 shadow-md cursor-pointer hover:bg-red-950/20"
            >
              {hideEditorUI ? "SHOW WORKSPACE TOOLS" : "COLLAPSE PANEL"}
            </button>
          </div>

          <div className="absolute bottom-6 left-0 right-0 w-full pointer-events-none z-40 px-4">
           <div className="relative w-full h-28 flex justify-between items-center max-w-2xl mx-auto px-2 pb-4">
              <div className="flex gap-4 pointer-events-auto">
                <button
                  onMouseDown={() => { (window as any).reactLeftActive = true; }}
                  onMouseUp={() => { (window as any).reactLeftActive = false; }}
                  onMouseLeave={() => { (window as any).reactLeftActive = false; }}
                  onTouchStart={() => { (window as any).reactLeftActive = true; }}
                  onTouchEnd={() => { (window as any).reactLeftActive = false; }}
                  className="w-24 h-24 bg-zinc-950/95 border-4 border-red-900 rounded-3xl flex items-center justify-center text-red-500 text-4xl font-black shadow-[0_10px_30px_rgba(127,29,29,0.5)] active:scale-90 cursor-pointer backdrop-blur-md transition-transform"
                >
                  ◀
                </button>
                <button
                  onMouseDown={() => { (window as any).reactRightActive = true; }}
                  onMouseUp={() => { (window as any).reactRightActive = false; }}
                  onMouseLeave={() => { (window as any).reactRightActive = false; }}
                  onTouchStart={() => { (window as any).reactRightActive = true; }}
                  onTouchEnd={() => { (window as any).reactRightActive = false; }}
                  className="w-24 h-24 bg-zinc-950/95 border-4 border-red-900 rounded-3xl flex items-center justify-center text-red-500 text-4xl font-black shadow-[0_10px_30px_rgba(127,29,29,0.5)] active:scale-90 cursor-pointer backdrop-blur-md transition-transform"
                >
                  ▶
                </button>
              </div>

              <div className="pointer-events-auto">
                <button
                  onMouseDown={() => { (window as any).reactJumpActive = true; }}
                  onMouseUp={() => { (window as any).reactJumpActive = false; }}
                  onMouseLeave={() => { (window as any).reactJumpActive = false; }}
                  onTouchStart={() => { (window as any).reactJumpActive = true; }}
                  onTouchEnd={() => { (window as any).reactJumpActive = false; }}
                  className="w-36 h-24 bg-gradient-to-t from-red-900 to-purple-800 border-4 border-white rounded-3xl flex flex-col items-center justify-center text-white font-black shadow-[0_10px_40px_rgba(127,29,29,0.6)] active:scale-90 cursor-pointer backdrop-blur-md transition-transform"
                >
                  <span className="text-4xl">▲</span>
                  <span className="text-sm font-mono font-bold tracking-widest mt-1 text-white/90">JUMP</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {toastMessage && (
        <div id="devvit-toast" className="visible">
          {toastMessage}
        </div>
      )}

      {isPaused && (
        <div className="devvit-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h2>RUN PAUSED</h2>
            </div>
            <div className="modal-body text-center">
              <div className="font-mono text-zinc-400 font-bold uppercase tracking-widest">[FROZEN ZONE]</div>
              <p className="text-xs text-zinc-400 mt-2 font-mono">Press RESUME below to enter the wasteland again.</p>
            </div>
            <div className="modal-footer justify-center gap-4">
              <button className="devvit-btn-secondary font-mono" onClick={handlePauseRestart}>RESTART</button>
              <button className="devvit-btn-primary font-mono" onClick={handlePauseToggle}>RESUME</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}