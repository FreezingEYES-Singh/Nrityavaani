import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { loadNataraja, cloneFigure } from "./natarajaModel";

/**
 * DanceStudioRoom (Natya Shala Rehearsal Studio)
 *
 * An authentic Indian Classical Dance Rehearsal Studio for NrityaVaani learners:
 * - Polished teakwood parquet dance floor with plank seams and satin specular luster.
 * - Sacred golden 16-petal lotus mandala & soft contact drop shadow under the Guru.
 * - Large rehearsal mirror wall with dark teakwood frame and practice dance barre rails.
 * - Tall sunlit studio windows with morning sunlight streaming in and outdoor garden vista.
 * - High ceiling with exposed dark teakwood architectural cross-beams and brass spotlights.
 * - Warm soothing sandalwood/cream plaster walls with wooden wainscoting.
 *
 * All geometries and textures are cleanly grouped and safely disposed on unmount.
 */

export interface StudioRoomResult {
  group: THREE.Group;
  dispose: () => void;
}

/**
 * Creates the procedural teakwood parquet floor texture with plank lines.
 */
function createTeakwoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Base rich teakwood color
    ctx.fillStyle = "#3e2719";
    ctx.fillRect(0, 0, 1024, 1024);

    // Draw parquet wooden planks (alternating grain & tones)
    const plankWidth = 128;
    const plankHeight = 32;

    for (let y = 0; y < 1024; y += plankHeight) {
      const rowShift = (Math.floor(y / plankHeight) % 2) * 64;
      for (let x = -64; x < 1024 + 64; x += plankWidth) {
        const px = x + rowShift;

        // Slight natural plank color variation
        const shade = Math.sin(px * 12.3 + y * 7.7);
        const red = Math.floor(62 + shade * 10);
        const green = Math.floor(39 + shade * 7);
        const blue = Math.floor(25 + shade * 5);

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(px + 1, y + 1, plankWidth - 2, plankHeight - 2);

        // Fine wood grain streaks
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(px + 10, y + 4, plankWidth - 20, 2);
        ctx.fillRect(px + 25, y + 12, plankWidth - 40, 1.5);
        ctx.fillRect(px + 5, y + 22, plankWidth - 15, 2);
      }
    }

    // Plank seams / dark grooves
    ctx.strokeStyle = "rgba(20, 10, 5, 0.65)";
    ctx.lineWidth = 2;
    for (let y = 0; y <= 1024; y += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates the sacred 16-petal golden lotus mandala & contact drop shadow disc.
 */
function createSacredStageMandala(): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const cx = 256;
    const cy = 256;

    // 1. Soft contact shadow directly under dancer's feet
    const shadowGrad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 130);
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    shadowGrad.addColorStop(0.45, "rgba(0, 0, 0, 0.40)");
    shadowGrad.addColorStop(0.75, "rgba(0, 0, 0, 0.14)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 130, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sacred Golden Lotus Mandala Ring
    ctx.save();
    ctx.translate(cx, cy);

    // Outer boundary ring
    ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 222, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner ring
    ctx.strokeStyle = "rgba(255, 153, 51, 0.40)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 196, 0, Math.PI * 2);
    ctx.stroke();

    // 16-petal Sacred Lotus Mandala
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 115);
      ctx.quadraticCurveTo(28, 158, 0, 215);
      ctx.quadraticCurveTo(-28, 158, 0, 115);

      ctx.fillStyle = i % 2 === 0 ? "rgba(212, 175, 55, 0.16)" : "rgba(255, 140, 0, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.48)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vein line
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(0, 205);
      ctx.strokeStyle = "rgba(255, 200, 100, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // Inner decorative bead ring
    const beadCount = 32;
    for (let i = 0; i < beadCount; i++) {
      const angle = (i / beadCount) * Math.PI * 2;
      const bx = Math.cos(angle) * 105;
      const by = Math.sin(angle) * 105;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212, 175, 55, 0.65)";
      ctx.fill();
    }

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(3.2, 3.2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.003;
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Creates the high-resolution Rehearsal Studio Screen texture featuring
 * the NrityaVaani logo emblem, 24K gold typography, and traditional Natya Shastra shlokas.
 */
function createStudioBackdropTexture(): { texture: THREE.CanvasTexture; cleanup: () => void } {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 810;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let isDisposed = false;

  function render(logoImg: HTMLImageElement | null) {
    if (!ctx || isDisposed) return;

    // 1. Satin Obsidian Velvet Rehearsal Screen Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 810);
    bgGrad.addColorStop(0, "#08060d");
    bgGrad.addColorStop(0.25, "#100c1b");
    bgGrad.addColorStop(0.7, "#140f22");
    bgGrad.addColorStop(1, "#07050b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 810);

    // 2. Warm Divine Golden Ambient Radial Halo behind Logo & Typography
    const haloGrad = ctx.createRadialGradient(1024, 220, 15, 1024, 220, 560);
    haloGrad.addColorStop(0, "rgba(242, 185, 55, 0.28)");
    haloGrad.addColorStop(0.3, "rgba(210, 130, 35, 0.14)");
    haloGrad.addColorStop(0.65, "rgba(100, 40, 80, 0.05)");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.fillRect(0, 0, 2048, 810);

    // 3. Double Gold Perimeter Framing
    ctx.save();
    // Outer frame
    ctx.strokeStyle = "#c59b27";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 2048 - 36, 810 - 36);

    // Inner pinstripe
    ctx.strokeStyle = "rgba(245, 215, 120, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 2048 - 56, 810 - 56);

    // Traditional Corner Ornamental Brackets
    const cornerIn = 28;
    const cornerArm = 36;
    const corners: [number, number, number, number][] = [
      [cornerIn, cornerIn, 1, 1],
      [2048 - cornerIn, cornerIn, -1, 1],
      [cornerIn, 810 - cornerIn, 1, -1],
      [2048 - cornerIn, 810 - cornerIn, -1, -1],
    ];
    ctx.strokeStyle = "#e5c158";
    ctx.lineWidth = 2.5;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * cornerArm, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * cornerArm);
      ctx.stroke();

      ctx.fillStyle = "#ffe699";
      ctx.beginPath();
      ctx.arc(cx + dx * 10, cy + dy * 10, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Classical Sanskrit Shlokas on Left & Right Studio Flanks
    ctx.save();
    ctx.fillStyle = "rgba(212, 175, 55, 0.38)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Left side:
    ctx.font = "italic 400 22px 'Tiro Devanagari Sanskrit', 'Noto Serif Devanagari', 'Martel', serif";
    ctx.fillText("यतो हस्तस्ततो दृष्टिर्यतो दृष्टिस्ततो मनः ।", 420, 248);
    ctx.font = "300 13px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = "rgba(212, 175, 55, 0.28)";
    ctx.fillText("Where the hands move, the eyes follow · Where the eyes go, the mind follows", 420, 276);

    // Right side:
    ctx.font = "italic 400 22px 'Tiro Devanagari Sanskrit', 'Noto Serif Devanagari', 'Martel', serif";
    ctx.fillStyle = "rgba(212, 175, 55, 0.38)";
    ctx.fillText("यतो मनस्ततो भावो यतो भावस्ततो रसः ॥", 1628, 248);
    ctx.font = "300 13px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = "rgba(212, 175, 55, 0.28)";
    ctx.fillText("Where the mind rests, emotion awakens · Where emotion blossoms, bliss arises", 1628, 276);
    ctx.restore();

    // 5. Centered Logo Emblem
    const logoCenterY = 138;
    const logoRadius = 96;

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      // Draw circular clipped logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(1024, logoCenterY, logoRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        logoImg,
        1024 - logoRadius,
        logoCenterY - logoRadius,
        logoRadius * 2,
        logoRadius * 2
      );
      ctx.restore();
    } else {
      // Elegant golden emblem placeholder while image loads
      ctx.save();
      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.beginPath();
      ctx.arc(1024, logoCenterY, logoRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Polished Gold Bezel & Halo Ring around Logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(1024, logoCenterY, logoRadius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#e6b830";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "rgba(240, 190, 50, 0.85)";
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(1024, logoCenterY, logoRadius + 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 235, 160, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // 7. Radiant 24K Gold "NrityaVaani" Typography
    ctx.save();
    ctx.font = "bold 68px 'Cinzel', 'Playfair Display', 'Times New Roman', 'Georgia', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textY = 285;

    // Metallic Gold Linear Gradient
    const goldGrad = ctx.createLinearGradient(0, textY - 35, 0, textY + 35);
    goldGrad.addColorStop(0.00, "#ffffff");
    goldGrad.addColorStop(0.20, "#fff5cc");
    goldGrad.addColorStop(0.48, "#f2c744");
    goldGrad.addColorStop(0.78, "#c69214");
    goldGrad.addColorStop(1.00, "#6e4b06");

    // Glow
    ctx.shadowColor = "rgba(225, 175, 45, 0.85)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = goldGrad;
    ctx.fillText("N R I T Y A V A A N I", 1024, textY);

    // Fine gold stroke highlights
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255, 245, 210, 0.85)";
    ctx.strokeText("N R I T Y A V A A N I", 1024, textY);
    ctx.restore();

    // 8. Subtitle: "✦  V I R T U A L   N A T Y A   S H A L A  ✦"
    ctx.save();
    const subY = 336;
    ctx.font = "600 18px 'Outfit', 'Inter', -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e6b830";
    ctx.shadowColor = "rgba(220, 160, 40, 0.55)";
    ctx.shadowBlur = 10;
    ctx.fillText("✦   V I R T U A L   N A T Y A   S H A L A   ✦", 1024, subY);
    ctx.restore();

    // 9. Tapered Accent Wings Flanking Subtitle
    ctx.save();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.65)";
    ctx.lineWidth = 1.5;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(640, subY);
    ctx.lineTo(820, subY);
    ctx.stroke();
    // Left diamond
    ctx.fillStyle = "#ffe699";
    ctx.beginPath();
    ctx.moveTo(634, subY);
    ctx.lineTo(639, subY - 4);
    ctx.lineTo(644, subY);
    ctx.lineTo(639, subY + 4);
    ctx.closePath();
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(1228, subY);
    ctx.lineTo(1408, subY);
    ctx.stroke();
    // Right diamond
    ctx.beginPath();
    ctx.moveTo(1404, subY);
    ctx.lineTo(1409, subY - 4);
    ctx.lineTo(1414, subY);
    ctx.lineTo(1409, subY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 10. Bottom Tapered Pedestal Filigree Divider
    ctx.save();
    const divY = 370;
    const divGrad = ctx.createLinearGradient(780, divY, 1268, divY);
    divGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
    divGrad.addColorStop(0.3, "rgba(212, 175, 55, 0.7)");
    divGrad.addColorStop(0.5, "rgba(255, 235, 160, 0.95)");
    divGrad.addColorStop(0.7, "rgba(212, 175, 55, 0.7)");
    divGrad.addColorStop(1, "rgba(212, 175, 55, 0)");

    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(780, divY);
    ctx.lineTo(1268, divY);
    ctx.stroke();

    // Center jewel
    ctx.fillStyle = "#fff4cc";
    ctx.beginPath();
    ctx.arc(1024, divY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Initial draw without waiting for image
  render(null);

  // Load logo image asynchronously
  if (typeof Image !== "undefined") {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => {
      render(logoImg);
      texture.needsUpdate = true;
    };
    logoImg.src = "/logo.png";
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      render(logoImg);
      texture.needsUpdate = true;
    }
  }

  return {
    texture,
    cleanup: () => {
      isDisposed = true;
    },
  };
}

/**
 * Creates the grand classical gallery header banner texture ("🪷 LEGENDS OF BHARATANATYAM 🪷").
 */
function createGalleryHeaderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep obsidian & rich mahogany background
  const bg = ctx.createLinearGradient(0, 0, 2048, 0);
  bg.addColorStop(0, "#100905");
  bg.addColorStop(0.2, "#20130a");
  bg.addColorStop(0.5, "#2c1a0e");
  bg.addColorStop(0.8, "#20130a");
  bg.addColorStop(1, "#100905");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 2048, 256);

  // Warm golden ambient illumination
  const aura = ctx.createRadialGradient(1024, 128, 40, 1024, 128, 950);
  aura.addColorStop(0, "rgba(245, 195, 60, 0.22)");
  aura.addColorStop(0.5, "rgba(200, 140, 40, 0.08)");
  aura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, 2048, 256);

  // Double gold borders
  ctx.strokeStyle = "#c59b27";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 2048 - 32, 256 - 32);

  ctx.strokeStyle = "rgba(245, 215, 120, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, 2048 - 52, 256 - 52);

  // Corner filigree accents
  const arm = 32;
  const corners: [number, number, number, number][] = [
    [26, 26, 1, 1],
    [2048 - 26, 26, -1, 1],
    [26, 256 - 26, 1, -1],
    [2048 - 26, 256 - 26, -1, -1],
  ];
  ctx.strokeStyle = "#e5c158";
  ctx.lineWidth = 2.5;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
    ctx.stroke();
  }

  // Typography
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Main Title: 🪷 LEGENDS OF BHARATANATYAM 🪷
  ctx.font = "bold 56px 'Cinzel', 'Playfair Display', 'Times New Roman', serif";
  const titleGrad = ctx.createLinearGradient(0, 60, 0, 140);
  titleGrad.addColorStop(0.0, "#ffffff");
  titleGrad.addColorStop(0.25, "#fff2b3");
  titleGrad.addColorStop(0.55, "#f2c744");
  titleGrad.addColorStop(0.85, "#c69214");
  titleGrad.addColorStop(1.0, "#6e4b06");
  ctx.shadowColor = "rgba(225, 175, 45, 0.85)";
  ctx.shadowBlur = 20;
  ctx.fillStyle = titleGrad;
  ctx.fillText("🪷   L E G E N D S   O F   B H A R A T A N A T Y A M   🪷", 1024, 102);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.font = "600 20px 'Outfit', 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255, 235, 180, 0.92)";
  ctx.fillText("V I R T U A L   N A T Y A   S H A L A   ·   H A L L   O F   M A S T E R S", 1024, 178);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface GalleryLegendData {
  name: string;
  role: string;
  dates: string;
  imageSrc: string;
  learningFocus: string;
  facts: string[];
  keywords: string;
  zPos: number;
}

/**
 * Creates high-resolution classical gallery portrait texture (1024x1536) for legendary Indian Classical dance pioneers.
 */
function createPerformerPortraitTexture(data: GalleryLegendData): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  function render(loadedImg: HTMLImageElement | null) {
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 1536);

    // 1. Vintage Warm Mahogany Parchment & Sepia Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1536);
    bgGrad.addColorStop(0, "#19100a");
    bgGrad.addColorStop(0.25, "#23160e");
    bgGrad.addColorStop(0.65, "#2c1c12");
    bgGrad.addColorStop(1, "#140c07");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1536);

    // Warm golden aura in upper canvas
    const auraGrad = ctx.createRadialGradient(512, 420, 40, 512, 420, 520);
    auraGrad.addColorStop(0, "rgba(245, 190, 60, 0.22)");
    auraGrad.addColorStop(0.5, "rgba(200, 130, 40, 0.08)");
    auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, 1024, 1536);

    // 2. Double 24K Gold Filigree Outer Frame
    ctx.strokeStyle = "#c59b27";
    ctx.lineWidth = 5;
    ctx.strokeRect(24, 24, 1024 - 48, 1536 - 48);

    ctx.strokeStyle = "rgba(245, 215, 120, 0.55)";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(36, 36, 1024 - 72, 1536 - 72);

    // Corner filigrees
    const cornerArm = 44;
    const corners: [number, number, number, number][] = [
      [36, 36, 1, 1],
      [1024 - 36, 36, -1, 1],
      [36, 1536 - 36, 1, -1],
      [1024 - 36, 1536 - 36, -1, -1],
    ];
    ctx.strokeStyle = "#e5c158";
    ctx.lineWidth = 2.5;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * cornerArm, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * cornerArm);
      ctx.stroke();
    }

    // 3. Cathedral Arched Portrait Photo Frame
    const px = 182;
    const py = 54;
    const pw = 660;
    const ph = 650;
    const cx = 512;
    const archR = pw / 2; // 330
    const archCenterY = py + archR; // 384

    // Clip path for photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, archCenterY, archR, Math.PI, 0);
    ctx.lineTo(px + pw, py + ph - 16);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - 16, py + ph);
    ctx.lineTo(px + 16, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - 16);
    ctx.closePath();
    ctx.clip();

    // Underlay / background within frame
    const frameBg = ctx.createLinearGradient(0, py, 0, py + ph);
    frameBg.addColorStop(0, "#3a2618");
    frameBg.addColorStop(0.5, "#22150c");
    frameBg.addColorStop(1, "#120a05");
    ctx.fillStyle = frameBg;
    ctx.fillRect(px, py, pw, ph);

    if (loadedImg && loadedImg.naturalWidth > 0) {
      // Draw image using object-fit cover logic
      const imgRatio = loadedImg.naturalWidth / loadedImg.naturalHeight;
      const targetRatio = pw / ph;
      let sWidth = loadedImg.naturalWidth;
      let sHeight = loadedImg.naturalHeight;
      let sx = 0;
      let sy = 0;

      if (imgRatio > targetRatio) {
        sWidth = loadedImg.naturalHeight * targetRatio;
        sx = (loadedImg.naturalWidth - sWidth) / 2;
      } else {
        sHeight = loadedImg.naturalWidth / targetRatio;
        // Bias slightly towards top to keep faces centered in frame
        sy = Math.max(0, (loadedImg.naturalHeight - sHeight) * 0.18);
      }

      ctx.drawImage(loadedImg, sx, sy, sWidth, sHeight, px, py, pw, ph);

      // Warm vintage museum wash
      ctx.fillStyle = "rgba(180, 110, 30, 0.08)";
      ctx.fillRect(px, py, pw, ph);

      // Soft vignette around perimeter
      const vig = ctx.createRadialGradient(cx, py + ph / 2, pw * 0.32, cx, py + ph / 2, pw * 0.62);
      vig.addColorStop(0, "rgba(0, 0, 0, 0)");
      vig.addColorStop(1, "rgba(10, 5, 2, 0.45)");
      ctx.fillStyle = vig;
      ctx.fillRect(px, py, pw, ph);
    } else {
      // Golden placeholder aura with lotus emblem
      const placeAura = ctx.createRadialGradient(cx, archCenterY, 30, cx, archCenterY, 260);
      placeAura.addColorStop(0, "rgba(245, 195, 60, 0.35)");
      placeAura.addColorStop(0.6, "rgba(180, 110, 30, 0.15)");
      placeAura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = placeAura;
      ctx.fillRect(px, py, pw, ph);

      ctx.font = "80px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e5c158";
      ctx.fillText("🪷", cx, archCenterY);
    }
    ctx.restore();

    // Double gold stroke along cathedral arch outline
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, archCenterY, archR, Math.PI, 0);
    ctx.lineTo(px + pw, py + ph - 16);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - 16, py + ph);
    ctx.lineTo(px + 16, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - 16);
    ctx.closePath();
    ctx.strokeStyle = "#e6b830";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(240, 190, 50, 0.65)";
    ctx.shadowBlur = 14;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 235, 160, 0.45)";
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Decorative beads along the arch curve
    const beadCount = 32;
    for (let b = 0; b <= beadCount; b++) {
      const angle = Math.PI + (b / beadCount) * Math.PI;
      const bx = cx + Math.cos(angle) * (archR + 12);
      const by = archCenterY + Math.sin(angle) * (archR + 12);
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe699";
      ctx.fill();
    }
    ctx.restore();

    // 4. Museum Plaque (Lower Section)
    const plaqueX = 48;
    const plaqueY = 730;
    const plaqueW = 928;
    const plaqueH = 756;

    ctx.save();
    const plaqueGrad = ctx.createLinearGradient(0, plaqueY, 0, plaqueY + plaqueH);
    plaqueGrad.addColorStop(0, "#191009");
    plaqueGrad.addColorStop(0.5, "#24160d");
    plaqueGrad.addColorStop(1, "#120a05");
    ctx.fillStyle = plaqueGrad;
    ctx.beginPath();
    ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 16);
    ctx.fill();

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(220, 170, 45, 0.6)";
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(plaqueX + 8, plaqueY + 8, plaqueW - 16, plaqueH - 16, 10);
    ctx.strokeStyle = "rgba(255, 235, 160, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // 5. Typography on Plaque
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Legend Name (Grand Classical Serif in 24K Gold)
    ctx.font = "bold 42px 'Cinzel', 'Playfair Display', 'Times New Roman', serif";
    const nameGrad = ctx.createLinearGradient(0, plaqueY + 45, 0, plaqueY + 95);
    nameGrad.addColorStop(0.00, "#ffffff");
    nameGrad.addColorStop(0.25, "#fff2b3");
    nameGrad.addColorStop(0.55, "#f2c744");
    nameGrad.addColorStop(0.85, "#c69214");
    nameGrad.addColorStop(1.00, "#6e4b06");
    ctx.shadowColor = "rgba(225, 175, 45, 0.85)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = nameGrad;
    ctx.fillText(data.name.toUpperCase(), 512, plaqueY + 70);

    // Lifespan & Role
    ctx.shadowBlur = 0;
    ctx.font = "600 21px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = "#f5c542";
    ctx.fillText(`${data.dates}   •   ${data.role.toUpperCase()}`, 512, plaqueY + 116);

    // Tapered gold divider
    const divGrad = ctx.createLinearGradient(140, plaqueY + 142, 884, plaqueY + 142);
    divGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
    divGrad.addColorStop(0.5, "rgba(255, 235, 160, 0.95)");
    divGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(140, plaqueY + 142);
    ctx.lineTo(884, plaqueY + 142);
    ctx.stroke();

    // Center jewel on divider
    ctx.fillStyle = "#fff2b3";
    ctx.beginPath();
    ctx.arc(512, plaqueY + 142, 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Guru Learning Focus Block (Educational Virtual Guru Concept)
    const focusBoxX = 76;
    const focusBoxY = plaqueY + 162;
    const focusBoxW = 872;
    const focusBoxH = 88;

    ctx.beginPath();
    ctx.roundRect(focusBoxX, focusBoxY, focusBoxW, focusBoxH, 12);
    ctx.fillStyle = "rgba(212, 175, 55, 0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 205, 80, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 15px 'Outfit', 'Cinzel', sans-serif";
    ctx.fillStyle = "#ffd970";
    ctx.fillText("✦   G U R U   L E A R N I N G   F O C U S   ✦", 512, focusBoxY + 26);

    ctx.font = "bold 26px 'Cinzel', 'Playfair Display', serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(255, 215, 0, 0.65)";
    ctx.shadowBlur = 12;
    ctx.fillText(data.learningFocus, 512, focusBoxY + 60);
    ctx.shadowBlur = 0;

    // 7. Key Contributions & Tradition (3 Short Facts)
    ctx.textAlign = "left";
    ctx.font = "bold 15px 'Outfit', 'Inter', sans-serif";
    ctx.fillStyle = "rgba(245, 210, 130, 0.85)";
    ctx.fillText("KEY CONTRIBUTIONS & TRADITION:", 88, plaqueY + 292);

    data.facts.forEach((fact, idx) => {
      const factY = plaqueY + 340 + idx * 72;
      // Bullet diamond
      ctx.font = "bold 18px 'Outfit', sans-serif";
      ctx.fillStyle = "#f5c542";
      ctx.fillText("✦", 88, factY);

      // Fact text
      ctx.font = "500 22px 'Outfit', 'Inter', sans-serif";
      ctx.fillStyle = "rgba(255, 245, 230, 0.95)";
      ctx.fillText(fact, 120, factY);
    });

    // 8. Wall Keywords Footer Bar
    const kwBoxX = 76;
    const kwBoxY = plaqueY + plaqueH - 80;
    const kwBoxW = 872;
    const kwBoxH = 54;

    ctx.beginPath();
    ctx.roundRect(kwBoxX, kwBoxY, kwBoxW, kwBoxH, 8);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 18px 'Outfit', monospace, sans-serif";
    ctx.fillStyle = "#e5c158";
    ctx.fillText(data.keywords, 512, kwBoxY + 28);

    ctx.restore();
  }

  // Load the image asynchronously and re-render on load
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    render(img);
    texture.needsUpdate = true;
  };
  img.onerror = (e) => {
    console.warn(`Failed to load legend image: ${data.imageSrc}`, e);
  };
  img.src = data.imageSrc;

  if (img.complete && img.naturalWidth > 0) {
    render(img);
  } else {
    render(null);
  }

  return texture;
}

/**
 * Builds the complete 3D Dance Classroom (Natya Shala Studio).
 */
export function createDanceStudioRoom(): StudioRoomResult {
  const group = new THREE.Group();
  group.name = "dance-studio-room";

  const disposables: { dispose(): void }[] = [];

  // Studio Dimensions
  const ROOM_WIDTH = 8.0;   // along X: -4.0 to +4.0
  const ROOM_DEPTH = 7.2;   // along Z: -3.6 to +3.6
  const ROOM_HEIGHT = 3.6;  // along Y: 0 to 3.6

  // Materials
  const floorTex = createTeakwoodFloorTexture();
  disposables.push(floorTex);

  const teakwoodFloorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.35,
    metalness: 0.06,
  });
  disposables.push(teakwoodFloorMat);

  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2a170d"),
    roughness: 0.42,
    metalness: 0.05,
  });
  disposables.push(darkTeakMat);

  const sandalwoodWallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e8dac3"), // authentic South Indian sandalwood temple plaster
    roughness: 0.88,
    metalness: 0.02,
  });
  disposables.push(sandalwoodWallMat);

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f0e9dc"),
    roughness: 0.90,
  });
  disposables.push(ceilingMat);

  const mirrorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c8d6e0"),
    roughness: 0.05,
    metalness: 0.96,
  });
  disposables.push(mirrorMat);

  const brassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4af37"),
    roughness: 0.25,
    metalness: 0.88,
  });
  disposables.push(brassMat);

  // 1. Polished Hardwood Teak Floor
  const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  disposables.push(floorGeo);
  const floorMesh = new THREE.Mesh(floorGeo, teakwoodFloorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Sacred Stage Mandala & Drop Shadow
  const stageMandala = createSacredStageMandala();
  group.add(stageMandala);
  disposables.push(stageMandala.geometry);
  if (stageMandala.material instanceof THREE.Material) {
    disposables.push(stageMandala.material);
    if ((stageMandala.material as THREE.MeshBasicMaterial).map) {
      disposables.push((stageMandala.material as THREE.MeshBasicMaterial).map!);
    }
  }

  // 2. High Ceiling with Exposed Wooden Beams
  const ceilingGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  disposables.push(ceilingGeo);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = ROOM_HEIGHT;
  group.add(ceilingMesh);

  // Architectural Dark Teakwood Cross-Beams
  const beamGeo = new THREE.BoxGeometry(ROOM_WIDTH, 0.18, 0.22);
  disposables.push(beamGeo);
  const beamCount = 4;
  for (let i = 0; i < beamCount; i++) {
    const bz = -ROOM_DEPTH / 2 + (i + 0.5) * (ROOM_DEPTH / beamCount);
    const beam = new THREE.Mesh(beamGeo, darkTeakMat);
    beam.position.set(0, ROOM_HEIGHT - 0.09, bz);
    group.add(beam);

    // Recessed brass studio spotlight cylinders on each beam
    for (const bx of [-1.8, 1.8]) {
      const spotGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.10, 16);
      const spotMesh = new THREE.Mesh(spotGeo, brassMat);
      spotMesh.position.set(bx, ROOM_HEIGHT - 0.20, bz);
      group.add(spotMesh);

      // Warm glowing spotlight lens
      const lensGeo = new THREE.CircleGeometry(0.055, 16);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff4d0 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(bx, ROOM_HEIGHT - 0.251, bz);
      group.add(lens);
    }
  }

  // 3. Walls (Back, Front, Left, Right) in Sandalwood Temple Plaster
  const backWallGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT);
  disposables.push(backWallGeo);
  const backWall = new THREE.Mesh(backWallGeo, sandalwoodWallMat);
  backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2);
  group.add(backWall);

  const frontWall = new THREE.Mesh(backWallGeo, sandalwoodWallMat);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2);
  group.add(frontWall);

  const sideWallGeo = new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT);
  disposables.push(sideWallGeo);
  const rightWall = new THREE.Mesh(sideWallGeo, sandalwoodWallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  group.add(rightWall);

  const leftWall = new THREE.Mesh(sideWallGeo, sandalwoodWallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  group.add(leftWall);

  // South Indian Temple Terracotta & Kumkum Frieze Band along Ceiling Line
  const friezeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#822206"), // rich temple terracotta / kumkum
    roughness: 0.65,
    metalness: 0.08,
  });
  disposables.push(friezeMat);

  const friezeH = 0.28;
  const friezeY = ROOM_HEIGHT - friezeH / 2 - 0.02;

  const friezeGeoX = new THREE.BoxGeometry(ROOM_WIDTH, friezeH, 0.035);
  disposables.push(friezeGeoX);
  const friezeBack = new THREE.Mesh(friezeGeoX, friezeMat);
  friezeBack.position.set(0, friezeY, -ROOM_DEPTH / 2 + 0.018);
  group.add(friezeBack);

  const friezeFront = new THREE.Mesh(friezeGeoX, friezeMat);
  friezeFront.position.set(0, friezeY, ROOM_DEPTH / 2 - 0.018);
  group.add(friezeFront);

  const friezeGeoZ = new THREE.BoxGeometry(0.035, friezeH, ROOM_DEPTH);
  disposables.push(friezeGeoZ);
  const friezeLeft = new THREE.Mesh(friezeGeoZ, friezeMat);
  friezeLeft.position.set(-ROOM_WIDTH / 2 + 0.018, friezeY, 0);
  group.add(friezeLeft);

  const friezeRight = new THREE.Mesh(friezeGeoZ, friezeMat);
  friezeRight.position.set(ROOM_WIDTH / 2 - 0.018, friezeY, 0);
  group.add(friezeRight);

  // 24K Gold Trim Moldings bordering the Terracotta Frieze
  const moldingGeoX = new THREE.BoxGeometry(ROOM_WIDTH + 0.02, 0.025, 0.045);
  disposables.push(moldingGeoX);
  const moldTopBack = new THREE.Mesh(moldingGeoX, brassMat);
  moldTopBack.position.set(0, friezeY + friezeH / 2, -ROOM_DEPTH / 2 + 0.02);
  group.add(moldTopBack);
  const moldBtmBack = new THREE.Mesh(moldingGeoX, brassMat);
  moldBtmBack.position.set(0, friezeY - friezeH / 2, -ROOM_DEPTH / 2 + 0.02);
  group.add(moldBtmBack);

  const moldTopFront = new THREE.Mesh(moldingGeoX, brassMat);
  moldTopFront.position.set(0, friezeY + friezeH / 2, ROOM_DEPTH / 2 - 0.02);
  group.add(moldTopFront);
  const moldBtmFront = new THREE.Mesh(moldingGeoX, brassMat);
  moldBtmFront.position.set(0, friezeY - friezeH / 2, ROOM_DEPTH / 2 - 0.02);
  group.add(moldBtmFront);

  const moldingGeoZ = new THREE.BoxGeometry(0.045, 0.025, ROOM_DEPTH + 0.02);
  disposables.push(moldingGeoZ);
  const moldTopLeft = new THREE.Mesh(moldingGeoZ, brassMat);
  moldTopLeft.position.set(-ROOM_WIDTH / 2 + 0.02, friezeY + friezeH / 2, 0);
  group.add(moldTopLeft);
  const moldBtmLeft = new THREE.Mesh(moldingGeoZ, brassMat);
  moldBtmLeft.position.set(-ROOM_WIDTH / 2 + 0.02, friezeY - friezeH / 2, 0);
  group.add(moldBtmLeft);

  const moldTopRight = new THREE.Mesh(moldingGeoZ, brassMat);
  moldTopRight.position.set(ROOM_WIDTH / 2 - 0.02, friezeY + friezeH / 2, 0);
  group.add(moldTopRight);
  const moldBtmRight = new THREE.Mesh(moldingGeoZ, brassMat);
  moldBtmRight.position.set(ROOM_WIDTH / 2 - 0.02, friezeY - friezeH / 2, 0);
  group.add(moldBtmRight);

  // Wooden Wainscoting (Skirting trim along bottom of all walls)
  const skirtHeight = 0.35;
  const skirtGeoX = new THREE.BoxGeometry(ROOM_WIDTH, skirtHeight, 0.04);
  const skirtBack = new THREE.Mesh(skirtGeoX, darkTeakMat);
  skirtBack.position.set(0, skirtHeight / 2, -ROOM_DEPTH / 2 + 0.02);
  group.add(skirtBack);

  const skirtGeoZ = new THREE.BoxGeometry(0.04, skirtHeight, ROOM_DEPTH);
  const skirtRight = new THREE.Mesh(skirtGeoZ, darkTeakMat);
  skirtRight.position.set(ROOM_WIDTH / 2 - 0.02, skirtHeight / 2, 0);
  group.add(skirtRight);

  const skirtLeft = new THREE.Mesh(skirtGeoZ, darkTeakMat);
  skirtLeft.position.set(-ROOM_WIDTH / 2 + 0.02, skirtHeight / 2, 0);
  group.add(skirtLeft);

  const skirtFront = new THREE.Mesh(skirtGeoX, darkTeakMat);
  skirtFront.position.set(0, skirtHeight / 2, ROOM_DEPTH / 2 - 0.02);
  group.add(skirtFront);

  // 4. Large Studio Rehearsal Mirror Wall & Dance Practice Barre
  // Placed on the Front Wall (at +ROOM_DEPTH / 2) directly facing the Guru and students!
  const MIRROR_WIDTH = 6.2;
  const MIRROR_HEIGHT = 2.45;
  const frameThick = 0.09;
  const frameDepth = 0.05;

  const frontMirrorGeo = new THREE.PlaneGeometry(MIRROR_WIDTH, MIRROR_HEIGHT);
  disposables.push(frontMirrorGeo);

  // Real-time Planar Reflector: renders crisp real-time reflections of the Guru and studio
  let frontMirror: THREE.Object3D;
  try {
    const reflector = new Reflector(frontMirrorGeo, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x94a3b8,
      multisample: 2,
    });
    reflector.rotation.y = Math.PI;
    reflector.position.set(0, 1.65, ROOM_DEPTH / 2 - 0.03);
    frontMirror = reflector;
    disposables.push(reflector);
  } catch {
    // High-fidelity fallback material if Reflector WebGL target is unavailable
    const fallbackMesh = new THREE.Mesh(frontMirrorGeo, mirrorMat);
    fallbackMesh.rotation.y = Math.PI;
    fallbackMesh.position.set(0, 1.65, ROOM_DEPTH / 2 - 0.03);
    frontMirror = fallbackMesh;
  }
  group.add(frontMirror);

  // Rehearsal Mirror Frame in Dark Polished Teak
  const hFrameGeo = new THREE.BoxGeometry(MIRROR_WIDTH + frameThick * 2, frameThick, frameDepth);
  disposables.push(hFrameGeo);

  const fTopFrame = new THREE.Mesh(hFrameGeo, darkTeakMat);
  fTopFrame.position.set(0, 1.65 + MIRROR_HEIGHT / 2 + frameThick / 2, ROOM_DEPTH / 2 - 0.03);
  group.add(fTopFrame);

  const fBtmFrame = new THREE.Mesh(hFrameGeo, darkTeakMat);
  fBtmFrame.position.set(0, 1.65 - MIRROR_HEIGHT / 2 - frameThick / 2, ROOM_DEPTH / 2 - 0.03);
  group.add(fBtmFrame);

  const vFrameGeo = new THREE.BoxGeometry(frameThick, MIRROR_HEIGHT, frameDepth);
  disposables.push(vFrameGeo);

  const fLeftFrame = new THREE.Mesh(vFrameGeo, darkTeakMat);
  fLeftFrame.position.set(-MIRROR_WIDTH / 2 - frameThick / 2, 1.65, ROOM_DEPTH / 2 - 0.03);
  group.add(fLeftFrame);

  const fRightFrame = new THREE.Mesh(vFrameGeo, darkTeakMat);
  fRightFrame.position.set(MIRROR_WIDTH / 2 + frameThick / 2, 1.65, ROOM_DEPTH / 2 - 0.03);
  group.add(fRightFrame);

  // 4 Polished Brass Corner Brackets on the Mirror Frame
  const cornerGeo = new THREE.BoxGeometry(0.12, 0.12, 0.055);
  disposables.push(cornerGeo);
  for (const cx of [-MIRROR_WIDTH / 2 - frameThick / 2, MIRROR_WIDTH / 2 + frameThick / 2]) {
    for (const cy of [1.65 + MIRROR_HEIGHT / 2 + frameThick / 2, 1.65 - MIRROR_HEIGHT / 2 - frameThick / 2]) {
      const corner = new THREE.Mesh(cornerGeo, brassMat);
      corner.position.set(cx, cy, ROOM_DEPTH / 2 - 0.028);
      group.add(corner);
    }
  }

  // Dance Practice Barre (Ballet/Natya double rail along the mirror wall)
  const barreRailGeo = new THREE.CylinderGeometry(0.026, 0.026, MIRROR_WIDTH + 0.4, 16);
  barreRailGeo.rotateZ(Math.PI / 2);
  disposables.push(barreRailGeo);

  // Upper barre rail at waist height (1.02m)
  const fUpperBarre = new THREE.Mesh(barreRailGeo, darkTeakMat);
  fUpperBarre.position.set(0, 1.02, ROOM_DEPTH / 2 - 0.16);
  group.add(fUpperBarre);

  // Lower barre rail for stretching/junior training (0.82m)
  const fLowerBarre = new THREE.Mesh(barreRailGeo, darkTeakMat);
  fLowerBarre.position.set(0, 0.82, ROOM_DEPTH / 2 - 0.16);
  group.add(fLowerBarre);

  // Brass wall-mounting brackets for the barre
  const bracketGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 10);
  bracketGeo.rotateX(Math.PI / 2);
  disposables.push(bracketGeo);
  const bracketXs = [-2.4, -1.2, 0, 1.2, 2.4];
  for (const bx of bracketXs) {
    const brkTop = new THREE.Mesh(bracketGeo, brassMat);
    brkTop.position.set(bx, 1.02, ROOM_DEPTH / 2 - 0.08);
    group.add(brkTop);

    const brkBtm = new THREE.Mesh(bracketGeo, brassMat);
    brkBtm.position.set(bx, 0.82, ROOM_DEPTH / 2 - 0.08);
    group.add(brkBtm);
  }

  // Warm Overhead Mirror Valance Illumination Strip
  const lightStripGeo = new THREE.BoxGeometry(MIRROR_WIDTH, 0.04, 0.06);
  disposables.push(lightStripGeo);
  const lightStripMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
  disposables.push(lightStripMat);
  const lightStrip = new THREE.Mesh(lightStripGeo, lightStripMat);
  lightStrip.position.set(0, 1.65 + MIRROR_HEIGHT / 2 + frameThick + 0.03, ROOM_DEPTH / 2 - 0.04);
  group.add(lightStrip);

  // Back Wall Rehearsal Panel (NrityaVaani Royal Academy Screen)
  const { texture: backdropTexture, cleanup: cleanupBackdrop } = createStudioBackdropTexture();
  disposables.push(backdropTexture);
  disposables.push({ dispose: cleanupBackdrop });

  const backdropMat = new THREE.MeshStandardMaterial({
    map: backdropTexture,
    roughness: 0.45,
    metalness: 0.12,
    emissive: new THREE.Color(0x181208),
    emissiveIntensity: 0.4,
  });
  disposables.push(backdropMat);

  const backMirrorGeo = new THREE.PlaneGeometry(MIRROR_WIDTH, MIRROR_HEIGHT);
  disposables.push(backMirrorGeo);
  const backMirrorMesh = new THREE.Mesh(backMirrorGeo, backdropMat);
  backMirrorMesh.position.set(0, 1.65, -ROOM_DEPTH / 2 + 0.02);
  group.add(backMirrorMesh);

  // 3D Polished Brass Bezel Ring framing the NrityaVaani logo crest
  const logoBezelGeo = new THREE.RingGeometry(0.288, 0.306, 64);
  disposables.push(logoBezelGeo);
  const logoBezelMesh = new THREE.Mesh(logoBezelGeo, brassMat);
  logoBezelMesh.position.set(0, 2.457, -ROOM_DEPTH / 2 + 0.024);
  group.add(logoBezelMesh);

  // Warm Overhead Screen Valance Illumination Strip
  const bLightStrip = new THREE.Mesh(lightStripGeo, lightStripMat);
  bLightStrip.position.set(0, 1.65 + MIRROR_HEIGHT / 2 + frameThick + 0.03, -ROOM_DEPTH / 2 + 0.04);
  group.add(bLightStrip);

  // Focused Warm Spotlight illuminating the Logo & NrityaVaani typography
  const backScreenSpot = new THREE.SpotLight(0xffecd2, 2.8, 8, Math.PI / 3.6, 0.45, 1.2);
  backScreenSpot.position.set(0, ROOM_HEIGHT - 0.2, -ROOM_DEPTH / 2 + 1.2);
  backScreenSpot.target.position.set(0, 2.05, -ROOM_DEPTH / 2 + 0.02);
  group.add(backScreenSpot);
  group.add(backScreenSpot.target);

  const bTopFrame = new THREE.Mesh(hFrameGeo, darkTeakMat);
  bTopFrame.position.set(0, 1.65 + MIRROR_HEIGHT / 2 + frameThick / 2, -ROOM_DEPTH / 2 + 0.02);
  group.add(bTopFrame);

  const bBtmFrame = new THREE.Mesh(hFrameGeo, darkTeakMat);
  bBtmFrame.position.set(0, 1.65 - MIRROR_HEIGHT / 2 - frameThick / 2, -ROOM_DEPTH / 2 + 0.02);
  group.add(bBtmFrame);

  const bLeftFrame = new THREE.Mesh(vFrameGeo, darkTeakMat);
  bLeftFrame.position.set(-MIRROR_WIDTH / 2 - frameThick / 2, 1.65, -ROOM_DEPTH / 2 + 0.02);
  group.add(bLeftFrame);

  const bRightFrame = new THREE.Mesh(vFrameGeo, darkTeakMat);
  bRightFrame.position.set(MIRROR_WIDTH / 2 + frameThick / 2, 1.65, -ROOM_DEPTH / 2 + 0.02);
  group.add(bRightFrame);

  // 4 Polished Brass Corner Brackets on the screen frame
  for (const cx of [-MIRROR_WIDTH / 2 - frameThick / 2, MIRROR_WIDTH / 2 + frameThick / 2]) {
    for (const cy of [1.65 + MIRROR_HEIGHT / 2 + frameThick / 2, 1.65 - MIRROR_HEIGHT / 2 - frameThick / 2]) {
      const corner = new THREE.Mesh(cornerGeo, brassMat);
      corner.position.set(cx, cy, -ROOM_DEPTH / 2 + 0.028);
      group.add(corner);
    }
  }

  const bUpperBarre = new THREE.Mesh(barreRailGeo, darkTeakMat);
  bUpperBarre.position.set(0, 1.02, -ROOM_DEPTH / 2 + 0.16);
  group.add(bUpperBarre);

  const bLowerBarre = new THREE.Mesh(barreRailGeo, darkTeakMat);
  bLowerBarre.position.set(0, 0.82, -ROOM_DEPTH / 2 + 0.16);
  group.add(bLowerBarre);

  for (const bx of bracketXs) {
    const brkTop = new THREE.Mesh(bracketGeo, brassMat);
    brkTop.position.set(bx, 1.02, -ROOM_DEPTH / 2 + 0.08);
    group.add(brkTop);

    const brkBtm = new THREE.Mesh(bracketGeo, brassMat);
    brkBtm.position.set(bx, 0.82, -ROOM_DEPTH / 2 + 0.08);
    group.add(brkBtm);
  }

  // 5. Classical Dance Hall of Fame Gallery (Left Wall)
  // Replaces generic windows with grand museum-grade framed portraits of iconic Indian Classical titans
  // 5. Classical Dance Hall of Fame Gallery (Left Wall)
  // Grand museum-grade gallery honoring iconic titans of Bharatanatyam with historical photos and Guru Learning Focus
  const galleryLegends: GalleryLegendData[] = [
    {
      name: "Rukmini Devi Arundale",
      role: "Pioneer · Founder of Kalakshetra",
      dates: "1904 – 1986",
      imageSrc: "/images/legends/rukmini.jpg",
      learningFocus: "Discipline • Technique • Tradition",
      facts: [
        "Revived & reshaped Bharatanatyam for the modern stage",
        "Founded Kalakshetra in Chennai in 1936; structured arts education",
        "Trained under Pandanallur Meenakshisundaram Pillai",
      ],
      keywords: "REVIVAL • EDUCATION • KALAKSHETRA • TRADITION",
      zPos: -1.80,
    },
    {
      name: "T. Balasaraswati",
      role: "Master of Abhinaya",
      dates: "1918 – 1984",
      imageSrc: "/images/legends/balasaraswati.jpg",
      learningFocus: "Abhinaya • Expression • Bhava",
      facts: [
        "Distinguished hereditary lineage of music & dance",
        "Renowned worldwide for soulful, profound depth of Abhinaya",
        "Trained under Kandappa Pillai · Sangeet Kalanidhi",
      ],
      keywords: "ABHINAYA • EXPRESSION • TRADITION • MUSIC",
      zPos: 0.0,
    },
    {
      name: "Yamini Krishnamurti",
      role: "Global Performer & Teacher",
      dates: "1940 – 2024",
      imageSrc: "/images/legends/yamini.jpg",
      learningFocus: "Performance • Stage Presence • Expression",
      facts: [
        "Trained at Kalakshetra & under legendary Tanjore masters",
        "Asthana Nartaki at Tirumala Tirupati Devasthanams",
        "Founded Nritya Kaustubh; trained generations of dancers",
      ],
      keywords: "PERFORMANCE • GLOBAL REACH • TEACHING • LEGACY",
      zPos: 1.80,
    },
  ];

  const PORTRAIT_W = 1.25;
  const PORTRAIT_H = 1.85;
  const pFrameThick = 0.075;
  const pFrameDepth = 0.055;

  const portraitGeo = new THREE.PlaneGeometry(PORTRAIT_W, PORTRAIT_H);
  disposables.push(portraitGeo);

  const hPFrameGeo = new THREE.BoxGeometry(pFrameDepth, pFrameThick, PORTRAIT_W + pFrameThick * 2);
  disposables.push(hPFrameGeo);

  const vPFrameGeo = new THREE.BoxGeometry(pFrameDepth, PORTRAIT_H, pFrameThick);
  disposables.push(vPFrameGeo);

  const pCornerGeo = new THREE.BoxGeometry(pFrameDepth + 0.008, 0.10, 0.10);
  disposables.push(pCornerGeo);

  for (const legend of galleryLegends) {
    const pTex = createPerformerPortraitTexture(legend);
    disposables.push(pTex);

    const pMat = new THREE.MeshStandardMaterial({
      map: pTex,
      roughness: 0.40,
      metalness: 0.10,
      emissive: new THREE.Color(0x181008),
      emissiveIntensity: 0.35,
    });
    disposables.push(pMat);

    // Portrait canvas mesh on Left Wall
    const pMesh = new THREE.Mesh(portraitGeo, pMat);
    pMesh.rotation.y = Math.PI / 2;
    pMesh.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80, legend.zPos);
    group.add(pMesh);

    // Carved Dark Teakwood Gallery Frame
    const pfTop = new THREE.Mesh(hPFrameGeo, darkTeakMat);
    pfTop.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80 + PORTRAIT_H / 2 + pFrameThick / 2, legend.zPos);
    group.add(pfTop);

    const pfBtm = new THREE.Mesh(hPFrameGeo, darkTeakMat);
    pfBtm.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80 - PORTRAIT_H / 2 - pFrameThick / 2, legend.zPos);
    group.add(pfBtm);

    const pfLeft = new THREE.Mesh(vPFrameGeo, darkTeakMat);
    pfLeft.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80, legend.zPos - PORTRAIT_W / 2 - pFrameThick / 2);
    group.add(pfLeft);

    const pfRight = new THREE.Mesh(vPFrameGeo, darkTeakMat);
    pfRight.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80, legend.zPos + PORTRAIT_W / 2 + pFrameThick / 2);
    group.add(pfRight);

    // 4 Polished Brass Corner Accents on Frame
    for (const cz of [legend.zPos - PORTRAIT_W / 2 - pFrameThick / 2, legend.zPos + PORTRAIT_W / 2 + pFrameThick / 2]) {
      for (const cy of [1.80 + PORTRAIT_H / 2 + pFrameThick / 2, 1.80 - PORTRAIT_H / 2 - pFrameThick / 2]) {
        const pCorner = new THREE.Mesh(pCornerGeo, brassMat);
        pCorner.position.set(-ROOM_WIDTH / 2 + 0.028, cy, cz);
        group.add(pCorner);
      }
    }

    // Gooseneck Brass Picture Light Fixture mounted above portrait
    const pLampArmGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.22, 8);
    pLampArmGeo.rotateZ(Math.PI / 3.2);
    disposables.push(pLampArmGeo);
    const pLampArm = new THREE.Mesh(pLampArmGeo, brassMat);
    pLampArm.position.set(-ROOM_WIDTH / 2 + 0.10, 1.80 + PORTRAIT_H / 2 + 0.08, legend.zPos);
    group.add(pLampArm);

    const pLampHeadGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.45, 16);
    disposables.push(pLampHeadGeo);
    const pLampHead = new THREE.Mesh(pLampHeadGeo, brassMat);
    pLampHead.position.set(-ROOM_WIDTH / 2 + 0.20, 1.80 + PORTRAIT_H / 2 + 0.14, legend.zPos);
    group.add(pLampHead);

    // Warm gallery accent spotlight illuminating the portrait
    const pSpot = new THREE.SpotLight(0xffecd0, 2.2, 5.0, Math.PI / 4, 0.45, 1.2);
    pSpot.position.set(-ROOM_WIDTH / 2 + 0.20, 1.80 + PORTRAIT_H / 2 + 0.14, legend.zPos);
    pSpot.target.position.set(-ROOM_WIDTH / 2 + 0.025, 1.80, legend.zPos);
    group.add(pSpot);
    group.add(pSpot.target);
  }

  // Grand Gallery Title Header: "🪷 LEGENDS OF BHARATANATYAM 🪷"
  const galleryHeaderTex = createGalleryHeaderTexture();
  disposables.push(galleryHeaderTex);
  const galleryHeaderMat = new THREE.MeshStandardMaterial({
    map: galleryHeaderTex,
    roughness: 0.35,
    metalness: 0.15,
    emissive: new THREE.Color(0x181008),
    emissiveIntensity: 0.30,
  });
  disposables.push(galleryHeaderMat);

  const galleryHeaderGeo = new THREE.PlaneGeometry(5.4, 0.34);
  disposables.push(galleryHeaderGeo);
  const galleryHeaderMesh = new THREE.Mesh(galleryHeaderGeo, galleryHeaderMat);
  galleryHeaderMesh.rotation.y = Math.PI / 2;
  galleryHeaderMesh.position.set(-ROOM_WIDTH / 2 + 0.025, 3.18, 0);
  group.add(galleryHeaderMesh);

  // Teak & Brass Header Frame Trim
  const hHeaderFrameGeo = new THREE.BoxGeometry(0.045, 0.035, 5.46);
  disposables.push(hHeaderFrameGeo);
  const hfTop = new THREE.Mesh(hHeaderFrameGeo, darkTeakMat);
  hfTop.position.set(-ROOM_WIDTH / 2 + 0.025, 3.18 + 0.17 + 0.018, 0);
  group.add(hfTop);
  const hfBtm = new THREE.Mesh(hHeaderFrameGeo, darkTeakMat);
  hfBtm.position.set(-ROOM_WIDTH / 2 + 0.025, 3.18 - 0.17 - 0.018, 0);
  group.add(hfBtm);

  // 6. Grand Lord Nataraja Sacred Temple Shrine (Right Wall)
  // Two-tier carved dark teakwood altar pedestal
  const altarStepGeo = new THREE.BoxGeometry(0.65, 0.32, 1.40);
  disposables.push(altarStepGeo);
  const altarStep = new THREE.Mesh(altarStepGeo, darkTeakMat);
  altarStep.position.set(ROOM_WIDTH / 2 - 0.34, 0.16, 0);
  group.add(altarStep);

  // Upper velvet altar covered in Crimson Temple Silk
  const velvetAltarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#750a12"), // deep crimson temple silk
    roughness: 0.72,
    metalness: 0.05,
  });
  disposables.push(velvetAltarMat);

  const altarTopGeo = new THREE.BoxGeometry(0.55, 0.28, 1.15);
  disposables.push(altarTopGeo);
  const altarTop = new THREE.Mesh(altarTopGeo, velvetAltarMat);
  altarTop.position.set(ROOM_WIDTH / 2 - 0.32, 0.46, 0);
  group.add(altarTop);

  // Gold fringe trim along altar perimeter
  const fringeGeo = new THREE.BoxGeometry(0.57, 0.03, 1.17);
  disposables.push(fringeGeo);
  const fringe = new THREE.Mesh(fringeGeo, brassMat);
  fringe.position.set(ROOM_WIDTH / 2 - 0.32, 0.585, 0);
  group.add(fringe);

  // Flower Garlands (Marigold Genda & Jasmine Mogra) draped along the altar front
  const garlandMatOrange = new THREE.MeshStandardMaterial({ color: 0xff7700, roughness: 0.6 });
  const garlandMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  disposables.push(garlandMatOrange, garlandMatWhite);

  const flowerCount = 18;
  const flowerGeo = new THREE.SphereGeometry(0.024, 8, 8);
  disposables.push(flowerGeo);
  for (let f = 0; f < flowerCount; f++) {
    const t = f / (flowerCount - 1);
    const zPos = -0.52 + t * 1.04;
    const ySag = 0.57 - Math.sin(t * Math.PI) * 0.12;
    const flw = new THREE.Mesh(flowerGeo, f % 2 === 0 ? garlandMatOrange : garlandMatWhite);
    flw.position.set(ROOM_WIDTH / 2 - 0.60, ySag, zPos);
    group.add(flw);
  }

  // Load and place the 1.85m Grand Bronze Nataraja Statue
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7c4d28"),
    roughness: 0.32,
    metalness: 0.85,
  });
  disposables.push(bronzeMat);

  loadNataraja()
    .then((natarajaScene) => {
      const nataraja = cloneFigure(natarajaScene, 1.85);
      nataraja.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.material = bronzeMat;
          m.castShadow = true;
        }
      });

      // Align statue base flush with local y = 0
      const bbox = new THREE.Box3().setFromObject(nataraja);
      nataraja.position.y -= bbox.min.y;

      const natarajaContainer = new THREE.Group();
      natarajaContainer.position.set(ROOM_WIDTH / 2 - 0.32, 0.60, 0);
      natarajaContainer.rotation.y = -Math.PI / 2;
      natarajaContainer.add(nataraja);
      group.add(natarajaContainer);
    })
    .catch((err) => {
      console.warn("Could not load Nataraja model for studio altar:", err);
    });

  // Dedicated Theatrical Spotlight illuminating Lord Nataraja
  const natarajaSpot = new THREE.SpotLight(0xffedd0, 3.5, 7.5, Math.PI / 3.8, 0.45, 1.1);
  natarajaSpot.position.set(ROOM_WIDTH / 2 - 1.4, ROOM_HEIGHT - 0.25, 0);
  natarajaSpot.target.position.set(ROOM_WIDTH / 2 - 0.32, 1.5, 0);
  group.add(natarajaSpot);
  group.add(natarajaSpot.target);

  // Pair of Traditional Tall Brass Kuthuvilakku Standing Temple Lamps
  function createKuthuvilakku(zOffset: number) {
    const lampGroup = new THREE.Group();
    // Base fluted circular stand
    const baseGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.06, 24);
    disposables.push(baseGeo);
    const baseMesh = new THREE.Mesh(baseGeo, brassMat);
    baseMesh.position.y = 0.03;
    lampGroup.add(baseMesh);

    // Tapered column shaft
    const shaftGeo = new THREE.CylinderGeometry(0.022, 0.035, 0.90, 16);
    disposables.push(shaftGeo);
    const shaftMesh = new THREE.Mesh(shaftGeo, brassMat);
    shaftMesh.position.y = 0.51;
    lampGroup.add(shaftMesh);

    // Decorative knops
    const knopGeo = new THREE.SphereGeometry(0.045, 12, 12);
    disposables.push(knopGeo);
    for (const ky of [0.25, 0.50, 0.75]) {
      const knop = new THREE.Mesh(knopGeo, brassMat);
      knop.position.y = ky;
      lampGroup.add(knop);
    }

    // Oil dish (Thandu)
    const dishGeo = new THREE.CylinderGeometry(0.12, 0.06, 0.05, 20);
    disposables.push(dishGeo);
    const dishMesh = new THREE.Mesh(dishGeo, brassMat);
    dishMesh.position.y = 0.98;
    lampGroup.add(dishMesh);

    // Swan / Kalasam finial crown
    const finialGeo = new THREE.ConeGeometry(0.03, 0.12, 12);
    disposables.push(finialGeo);
    const finialMesh = new THREE.Mesh(finialGeo, brassMat);
    finialMesh.position.y = 1.07;
    lampGroup.add(finialMesh);

    // Flickering warm golden diya flame
    const kFlameGeo = new THREE.SphereGeometry(0.016, 8, 8);
    kFlameGeo.scale(1, 2.2, 1);
    disposables.push(kFlameGeo);
    const kFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa11 });
    disposables.push(kFlameMat);
    const kFlameMesh = new THREE.Mesh(kFlameGeo, kFlameMat);
    kFlameMesh.position.y = 1.02;
    lampGroup.add(kFlameMesh);

    // Warm flame ambient point light
    const kFlameLight = new THREE.PointLight(0xff9922, 1.4, 2.8, 1.5);
    kFlameLight.position.y = 1.05;
    lampGroup.add(kFlameLight);

    lampGroup.position.set(ROOM_WIDTH / 2 - 0.50, 0, zOffset);
    return lampGroup;
  }

  group.add(createKuthuvilakku(-0.80));
  group.add(createKuthuvilakku(0.80));

  // 7. Lived-in Classical Natya Shala Practice Accessories

  // A. Low Polished Teak Guru / Student Side Bench
  const benchGeo = new THREE.BoxGeometry(0.38, 0.40, 1.35);
  disposables.push(benchGeo);
  const benchMesh = new THREE.Mesh(benchGeo, darkTeakMat);
  benchMesh.position.set(ROOM_WIDTH / 2 - 0.28, 0.20, 1.85);
  group.add(benchMesh);

  // B. Ghungroos / Salangai (Red Felt Ankle Bell Straps with Gleaming Brass Bells)
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x991118, roughness: 0.8 });
  disposables.push(strapMat);
  const strapGeo = new THREE.BoxGeometry(0.24, 0.02, 0.14);
  disposables.push(strapGeo);

  for (const s of [0, 1]) {
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(ROOM_WIDTH / 2 - 0.28 + (s === 0 ? -0.04 : 0.04), 0.41, 1.70 + s * 0.22);
    group.add(strap);

    // Rows of brass bells
    const bellSphereGeo = new THREE.SphereGeometry(0.012, 8, 8);
    disposables.push(bellSphereGeo);
    for (let r = -2; r <= 2; r++) {
      for (let c = -1; c <= 1; c++) {
        const bell = new THREE.Mesh(bellSphereGeo, brassMat);
        bell.position.set(
          strap.position.x + c * 0.05,
          0.425,
          strap.position.z + r * 0.025
        );
        group.add(bell);
      }
    }
  }

  // C. Nattuvanar's Tattu Kazhi & Tattu Palakai (Wooden Beating Block & Stick)
  const palakaiMat = new THREE.MeshStandardMaterial({ color: 0x3d1e0d, roughness: 0.35 });
  disposables.push(palakaiMat);
  const palakaiGeo = new THREE.BoxGeometry(0.18, 0.06, 0.28);
  disposables.push(palakaiGeo);
  const palakai = new THREE.Mesh(palakaiGeo, palakaiMat);
  palakai.position.set(ROOM_WIDTH / 2 - 0.28, 0.44, 2.25);
  group.add(palakai);

  // Tattu Kazhi (stick) resting across the block
  const kazhiGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.36, 12);
  kazhiGeo.rotateZ(Math.PI / 2);
  kazhiGeo.rotateY(0.25);
  disposables.push(kazhiGeo);
  const kazhi = new THREE.Mesh(kazhiGeo, darkTeakMat);
  kazhi.position.set(ROOM_WIDTH / 2 - 0.28, 0.48, 2.25);
  group.add(kazhi);

  // D. Bronze Manjira / Thalam Cymbals with Red Sacred Cord
  const manjiraGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.015, 16);
  disposables.push(manjiraGeo);
  const m1 = new THREE.Mesh(manjiraGeo, brassMat);
  m1.position.set(ROOM_WIDTH / 2 - 0.22, 0.415, 1.48);
  group.add(m1);

  const m2 = new THREE.Mesh(manjiraGeo, brassMat);
  m2.position.set(ROOM_WIDTH / 2 - 0.32, 0.415, 1.48);
  m2.rotation.z = 0.18;
  group.add(m2);

  // E. Large Traditional South Indian Brass Urli with Floating Petals & Diya
  const urliGeo = new THREE.CylinderGeometry(0.28, 0.18, 0.12, 28);
  disposables.push(urliGeo);
  const urli = new THREE.Mesh(urliGeo, brassMat);
  urli.position.set(ROOM_WIDTH / 2 - 0.70, 0.06, -1.55);
  group.add(urli);

  // Water surface
  const waterGeo = new THREE.CircleGeometry(0.26, 24);
  waterGeo.rotateX(-Math.PI / 2);
  disposables.push(waterGeo);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1a3344,
    roughness: 0.1,
    metalness: 0.3,
  });
  disposables.push(waterMat);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(ROOM_WIDTH / 2 - 0.70, 0.11, -1.55);
  group.add(water);

  // Floating rose & lotus petals in the Urli
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xcc2255, roughness: 0.7 });
  disposables.push(petalMat);
  const petalGeo = new THREE.CircleGeometry(0.022, 8);
  petalGeo.rotateX(-Math.PI / 2);
  disposables.push(petalGeo);
  for (let p = 0; p < 12; p++) {
    const pa = (p / 12) * Math.PI * 2;
    const pr = 0.12 + (p % 3) * 0.04;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(
      ROOM_WIDTH / 2 - 0.70 + Math.cos(pa) * pr,
      0.112,
      -1.55 + Math.sin(pa) * pr
    );
    petal.rotation.y = pa;
    group.add(petal);
  }

  // Floating center diya candle
  const fDiyaGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.03, 12);
  disposables.push(fDiyaGeo);
  const fDiya = new THREE.Mesh(fDiyaGeo, brassMat);
  fDiya.position.set(ROOM_WIDTH / 2 - 0.70, 0.12, -1.55);
  group.add(fDiya);

  const fFlameGeo = new THREE.SphereGeometry(0.012, 8, 8);
  fFlameGeo.scale(1, 2, 1);
  disposables.push(fFlameGeo);
  const fFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa11 });
  disposables.push(fFlameMat);
  const fFlame = new THREE.Mesh(fFlameGeo, fFlameMat);
  fFlame.position.set(ROOM_WIDTH / 2 - 0.70, 0.145, -1.55);
  group.add(fFlame);

  const fFlameLight = new THREE.PointLight(0xffa020, 0.9, 2.0);
  fFlameLight.position.set(ROOM_WIDTH / 2 - 0.70, 0.18, -1.55);
  group.add(fFlameLight);

  // F. Rolled Woven Dance Practice Mats (Kora Pai) leaning against the corner
  const matMat = new THREE.MeshStandardMaterial({
    color: 0xba9b6c, // woven straw reed
    roughness: 0.85,
  });
  disposables.push(matMat);
  const matRollGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.40, 16);
  disposables.push(matRollGeo);

  const mat1 = new THREE.Mesh(matRollGeo, matMat);
  mat1.position.set(-ROOM_WIDTH / 2 + 0.16, 0.65, -ROOM_DEPTH / 2 + 0.22);
  mat1.rotation.z = -0.12;
  mat1.rotation.x = 0.08;
  group.add(mat1);

  const mat2 = new THREE.Mesh(matRollGeo, matMat);
  mat2.position.set(-ROOM_WIDTH / 2 + 0.28, 0.65, -ROOM_DEPTH / 2 + 0.20);
  mat2.rotation.z = -0.16;
  mat2.rotation.x = -0.06;
  group.add(mat2);

  return {
    group,
    dispose: () => {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      disposables.forEach((d) => d.dispose());
    },
  };
}
