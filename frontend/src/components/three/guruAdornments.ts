import * as THREE from "three";
import type { Sex } from "./figureRig";

/**
 * Traditional Bharatanatyam Adornments (Aharya Abhinaya)
 *
 * In classical Bharatanatyam, Aharya Abhinaya (expression through costume,
 * jewelry, hair, and makeup) is sacred and codified by the Natya Shastra.
 *
 * Head Bone Local Coordinates (measured directly from 3D figure geometry):
 * - Sagittal midline: X = 0.000
 * - Crown (top of head): Y = 0.252, Z = -0.025
 * - Forehead / Hairline: Y = 0.177, Z = -0.135
 * - Ajna Chakra (Bindi): Y = 0.145, Z = -0.148
 * - Eyes level: Y = 0.120, Z = -0.146, X = ±0.038
 * - Lips: Y = 0.060, Z = -0.153
 * - Ears: Y = 0.120, Z = +0.004, X = ±0.104
 * - Back of skull (Kondai bun location): Y = 0.145, Z = +0.120 to +0.145
 *
 * Note on Axes: In the head bone's local space, -Z points forward (toward the
 * face and audience), +Z points backward (toward the back of the head), and
 * +Y points upward toward the crown.
 */

function createAdornmentMaterials() {
  const templeGold = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4af37"),
    roughness: 0.22,
    metalness: 0.88,
    emissive: new THREE.Color("#352405"),
  });

  const rubyKemp = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#9b111e"),
    roughness: 0.16,
    metalness: 0.15,
    emissive: new THREE.Color("#2a0408"),
  });

  const hair = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0d0b0a"),
    roughness: 0.38,
    metalness: 0.05,
  });

  const mograJasmine = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#faf8ee"),
    roughness: 0.42,
    emissive: new THREE.Color("#30291a"),
  });

  const kohl = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#080808"),
    roughness: 0.40,
    metalness: 0.0,
  });

  const eyeSclera = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f6f4ed"),
    roughness: 0.20,
    metalness: 0.0,
  });

  const eyeIris = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#24140b"),
    roughness: 0.12,
    metalness: 0.08,
  });

  const kumkumRed = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#a81418"),
    roughness: 0.65,
    metalness: 0.0,
    emissive: new THREE.Color("#240204"),
  });

  const chandanWhite = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f5eedc"),
    roughness: 0.55,
    metalness: 0.0,
  });

  const lipsRuby = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#aa2238"),
    roughness: 0.35,
    metalness: 0.04,
    emissive: new THREE.Color("#220408"),
  });

  const skinContour = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#6b3524"),
    roughness: 0.70,
    metalness: 0.0,
    transparent: true,
    opacity: 0.50,
  });

  const earSkin = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#b97950"),
    roughness: 0.46,
    metalness: 0.04,
  });

  const ghungrooPad = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7b1119"),
    roughness: 0.60,
    metalness: 0.05,
  });

  const ghungrooBell = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e0b642"),
    roughness: 0.20,
    metalness: 0.90,
    emissive: new THREE.Color("#332403"),
  });

  return {
    templeGold,
    rubyKemp,
    hair,
    mograJasmine,
    kohl,
    eyeSclera,
    eyeIris,
    kumkumRed,
    chandanWhite,
    lipsRuby,
    skinContour,
    earSkin,
    ghungrooPad,
    ghungrooBell,
  };
}

/**
 * Creates a high-resolution (1024x1024) procedural classical Bharatanatyam
 * facial texture for the 3D Guru avatar.
 *
 * Features:
 * - Luminous honey-sandalwood complexion matching the body skin tone.
 * - Expressive Drishti Bheda almond eyes with deep hazel iris, pupil & twin catchlights.
 * - Iconic dramatic winged kohl/kajal eyeliner with upward wing flick.
 * - Arched black eyebrows (Bhru Bhedas) with natural hair taper.
 * - Sacred Kumkum Bindi & Chandan micro-accents.
 * - Delicate nose bridge contour & traditional gold-ruby Mookuthi nose stud.
 * - Sculpted terracotta-ruby lips with a warm, compassionate Guru smile.
 * - Soft rose-terracotta cheek blush (Kapola) radiating health and vitality.
 * - Alpha edge falloff blending seamlessly into the skull mesh.
 */
function createGuruFaceCanvasTexture(sex: Sex): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, 1024, 1024);
  const cx = 512;

  // 1. Soft Skin Radiance & Warmth (Luminous Tejas glow)
  const skinGlow = ctx.createRadialGradient(cx, 500, 80, cx, 500, 490);
  skinGlow.addColorStop(0, "rgba(215, 145, 100, 0.35)");
  skinGlow.addColorStop(0.55, "rgba(185, 121, 80, 0.20)");
  skinGlow.addColorStop(0.90, "rgba(155, 95, 60, 0.08)");
  skinGlow.addColorStop(1, "rgba(185, 121, 80, 0)");
  ctx.fillStyle = skinGlow;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. High Cheekbone Glow & Soft Rose-Terracotta Blush (Kapola)
  if (sex === "female") {
    for (const side of [-1, 1]) {
      const cheekX = cx + side * 220;
      const cheekY = 560;

      const blush = ctx.createRadialGradient(cheekX, cheekY + 15, 20, cheekX, cheekY + 15, 150);
      blush.addColorStop(0, "rgba(220, 85, 75, 0.32)");
      blush.addColorStop(0.50, "rgba(200, 80, 68, 0.15)");
      blush.addColorStop(1, "rgba(185, 121, 80, 0)");
      ctx.fillStyle = blush;
      ctx.beginPath();
      ctx.arc(cheekX, cheekY + 15, 150, 0, Math.PI * 2);
      ctx.fill();

      const highlight = ctx.createRadialGradient(cheekX - side * 15, cheekY - 50, 10, cheekX - side * 15, cheekY - 50, 95);
      highlight.addColorStop(0, "rgba(255, 235, 210, 0.26)");
      highlight.addColorStop(0.60, "rgba(245, 215, 190, 0.08)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(cheekX - side * 15, cheekY - 50, 95, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Delicate Natural Nose Contouring (Soft diffuse airbrushing)
  ctx.save();
  for (const side of [-1, 1]) {
    const grad = ctx.createRadialGradient(cx + side * 28, 520, 8, cx + side * 28, 520, 45);
    grad.addColorStop(0, "rgba(100, 48, 26, 0.16)");
    grad.addColorStop(0.6, "rgba(110, 52, 28, 0.06)");
    grad.addColorStop(1, "rgba(185, 121, 80, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx + side * 26, 525, 22, 65, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gentle bridge highlight
  const bridgeHl = ctx.createRadialGradient(cx, 520, 5, cx, 520, 26);
  bridgeHl.addColorStop(0, "rgba(255, 245, 235, 0.22)");
  bridgeHl.addColorStop(0.7, "rgba(255, 245, 235, 0.07)");
  bridgeHl.addColorStop(1, "rgba(255, 245, 235, 0)");
  ctx.fillStyle = bridgeHl;
  ctx.beginPath();
  ctx.ellipse(cx, 520, 12, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle nose tip roundness
  const tipHl = ctx.createRadialGradient(cx, 610, 3, cx, 610, 20);
  tipHl.addColorStop(0, "rgba(255, 245, 235, 0.34)");
  tipHl.addColorStop(0.55, "rgba(255, 235, 215, 0.16)");
  tipHl.addColorStop(1, "rgba(185, 121, 80, 0)");
  ctx.fillStyle = tipHl;
  ctx.beginPath();
  ctx.arc(cx, 610, 20, 0, Math.PI * 2);
  ctx.fill();

  // Delicate nostril flares
  ctx.strokeStyle = "rgba(90, 40, 22, 0.42)";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(cx - 30, 618, 13, Math.PI * 0.65, Math.PI * 1.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx + 30, 618, 13, Math.PI * 1.45, Math.PI * 2.35);
  ctx.stroke();

  // Under-nose septum shadow
  const septumGrad = ctx.createRadialGradient(cx, 628, 4, cx, 628, 22);
  septumGrad.addColorStop(0, "rgba(75, 30, 18, 0.42)");
  septumGrad.addColorStop(0.65, "rgba(95, 40, 22, 0.16)");
  septumGrad.addColorStop(1, "rgba(185, 121, 80, 0)");
  ctx.fillStyle = septumGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 628, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Classical South Indian Mookuthi (Nose Stud on Left Nostril)
  if (sex === "female") {
    ctx.save();
    const studX = cx - 40;
    const studY = 610;

    // 24K Gold base cluster
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(studX, studY, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // 6 small gold outer petal beads
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = studX + Math.cos(a) * 6.5;
      const py = studY + Math.sin(a) * 6.5;
      ctx.fillStyle = "#f3d268";
      ctx.beginPath();
      ctx.arc(px, py, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center Kemp Ruby Gem
    const rubyGrad = ctx.createRadialGradient(studX - 1, studY - 1, 0.6, studX, studY, 4.4);
    rubyGrad.addColorStop(0, "#e8263c");
    rubyGrad.addColorStop(0.7, "#a81418");
    rubyGrad.addColorStop(1, "#54080c");
    ctx.fillStyle = rubyGrad;
    ctx.beginPath();
    ctx.arc(studX, studY, 4.4, 0, Math.PI * 2);
    ctx.fill();

    // Glimmer catchlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(studX - 1.4, studY - 1.4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Philtrum Columns & Cupid's Bow Foundation
  ctx.save();
  for (const side of [-1, 1]) {
    const colGrad = ctx.createLinearGradient(cx + side * 13, 632, cx + side * 13, 700);
    colGrad.addColorStop(0, "rgba(255, 245, 235, 0.10)");
    colGrad.addColorStop(0.5, "rgba(255, 245, 235, 0.20)");
    colGrad.addColorStop(1, "rgba(255, 245, 235, 0.05)");
    ctx.fillStyle = colGrad;
    ctx.beginPath();
    ctx.ellipse(cx + side * 10, 666, 3.8, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const philtDep = ctx.createLinearGradient(cx, 632, cx, 700);
  philtDep.addColorStop(0, "rgba(85, 35, 20, 0.16)");
  philtDep.addColorStop(0.65, "rgba(85, 35, 20, 0.08)");
  philtDep.addColorStop(1, "rgba(85, 35, 20, 0)");
  ctx.fillStyle = philtDep;
  ctx.beginPath();
  ctx.ellipse(cx, 666, 5.0, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. Sculpted Classical Lips & Compassionate Guru Smile (Hasya Abhinaya)
  ctx.save();
  const lipY = 720;
  const lipHalfWidth = 118;
  const lipLeft = cx - lipHalfWidth;
  const lipRight = cx + lipHalfWidth;
  const cornerY = lipY - 5;

  // A. Upper Lip with Defined Cupid's Bow
  ctx.beginPath();
  ctx.moveTo(lipLeft, cornerY);
  ctx.bezierCurveTo(cx - 65, lipY - 30, cx - 38, lipY - 35, cx - 20, lipY - 35);
  ctx.bezierCurveTo(cx - 9, lipY - 24, cx + 9, lipY - 24, cx + 20, lipY - 35);
  ctx.bezierCurveTo(cx + 38, lipY - 35, cx + 65, lipY - 30, lipRight, cornerY);
  ctx.bezierCurveTo(cx + 48, lipY + 3, cx + 18, lipY + 6, cx, lipY + 6);
  ctx.bezierCurveTo(cx - 18, lipY + 6, cx - 48, lipY + 3, lipLeft, cornerY);
  ctx.closePath();

  const upperLipGrad = ctx.createLinearGradient(cx, lipY - 35, cx, lipY + 6);
  upperLipGrad.addColorStop(0, "#c42a42");
  upperLipGrad.addColorStop(0.65, "#a41b2f");
  upperLipGrad.addColorStop(1, "#740f1e");
  ctx.fillStyle = upperLipGrad;
  ctx.fill();

  // B. Full, Supple Lower Lip
  ctx.beginPath();
  ctx.moveTo(lipLeft, cornerY);
  ctx.bezierCurveTo(cx - 48, lipY + 3, cx - 18, lipY + 6, cx, lipY + 6);
  ctx.bezierCurveTo(cx + 18, lipY + 6, cx + 48, lipY + 3, lipRight, cornerY);
  ctx.bezierCurveTo(cx + 68, lipY + 54, cx + 34, lipY + 62, cx, lipY + 62);
  ctx.bezierCurveTo(cx - 34, lipY + 62, cx - 68, lipY + 54, lipLeft, cornerY);
  ctx.closePath();

  const lowerLipGrad = ctx.createLinearGradient(cx, lipY + 6, cx, lipY + 62);
  lowerLipGrad.addColorStop(0, "#d13149");
  lowerLipGrad.addColorStop(0.45, "#b82138");
  lowerLipGrad.addColorStop(0.85, "#8d1325");
  lowerLipGrad.addColorStop(1, "#660d1b");
  ctx.fillStyle = lowerLipGrad;
  ctx.fill();

  // C. Satin Gloss Highlight (Center lower lip)
  const lipGloss = ctx.createRadialGradient(cx, lipY + 30, 4, cx, lipY + 30, 40);
  lipGloss.addColorStop(0, "rgba(255, 230, 238, 0.62)");
  lipGloss.addColorStop(0.40, "rgba(255, 190, 202, 0.28)");
  lipGloss.addColorStop(1, "rgba(209, 49, 73, 0)");
  ctx.fillStyle = lipGloss;
  ctx.beginPath();
  ctx.ellipse(cx, lipY + 30, 42, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cupid's bow crest edge highlight
  ctx.strokeStyle = "rgba(255, 235, 240, 0.42)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 28, lipY - 33);
  ctx.bezierCurveTo(cx - 9, lipY - 24, cx + 9, lipY - 24, cx + 28, lipY - 33);
  ctx.stroke();

  // Warm smile corner accents
  for (const side of [-1, 1]) {
    const scX = cx + side * (lipHalfWidth + 2);
    const scY = cornerY;
    const cornerGrad = ctx.createRadialGradient(scX, scY, 1, scX, scY, 8);
    cornerGrad.addColorStop(0, "rgba(75, 15, 22, 0.70)");
    cornerGrad.addColorStop(0.6, "rgba(110, 30, 35, 0.26)");
    cornerGrad.addColorStop(1, "rgba(185, 121, 80, 0)");
    ctx.fillStyle = cornerGrad;
    ctx.beginPath();
    ctx.arc(scX, scY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Parting line
  ctx.strokeStyle = "rgba(65, 10, 18, 0.65)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(lipLeft + 8, cornerY);
  ctx.bezierCurveTo(cx - 42, lipY + 3, cx, lipY + 5, cx + 42, lipY + 3);
  ctx.lineTo(lipRight - 8, cornerY);
  ctx.stroke();

  // D. Soft Chin Shadow underneath lower lip
  const chinShadow = ctx.createRadialGradient(cx, lipY + 80, 5, cx, lipY + 80, 52);
  chinShadow.addColorStop(0, "rgba(75, 30, 18, 0.32)");
  chinShadow.addColorStop(0.55, "rgba(95, 40, 25, 0.14)");
  chinShadow.addColorStop(1, "rgba(185, 121, 80, 0)");
  ctx.fillStyle = chinShadow;
  ctx.beginPath();
  ctx.ellipse(cx, lipY + 80, 52, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft chin mound highlight
  const chinHighlight = ctx.createRadialGradient(cx, lipY + 115, 5, cx, lipY + 115, 45);
  chinHighlight.addColorStop(0, "rgba(255, 240, 225, 0.22)");
  chinHighlight.addColorStop(0.6, "rgba(240, 215, 195, 0.08)");
  chinHighlight.addColorStop(1, "rgba(185, 121, 80, 0)");
  ctx.fillStyle = chinHighlight;
  ctx.beginPath();
  ctx.ellipse(cx, lipY + 115, 44, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Expressive Drishti Bheda Eyes (Large, Open, Luminous Lotus Eyes)
  const eyeY = 450;
  const eyeSpacing = 175;
  const eyeWidth = 180;
  const eyeHeight = 72;

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;

    ctx.save();

    // Eye geometry coordinates: generous, open, alert almond arch
    const inX = ex - side * (eyeWidth * 0.46);
    const inY = eyeY + 4;
    const outX = ex + side * (eyeWidth * 0.54);
    const outY = eyeY - 4;
    const topPeakX = ex + side * 5;
    const topPeakY = eyeY - eyeHeight * 0.54;
    const btmDipX = ex + side * 3;
    const btmDipY = eyeY + eyeHeight * 0.46;

    // A. Eye Sclera (White base)
    ctx.beginPath();
    ctx.moveTo(inX, inY);
    ctx.bezierCurveTo(inX + side * 24, topPeakY, topPeakX, topPeakY, outX, outY);
    ctx.bezierCurveTo(btmDipX, btmDipY, inX + side * 28, btmDipY, inX, inY);
    ctx.closePath();
    ctx.fillStyle = "#faf6ed";
    ctx.fill();

    // Soft upper shadow on sclera under upper lid
    const scleraShadow = ctx.createLinearGradient(ex, topPeakY, ex, eyeY + 15);
    scleraShadow.addColorStop(0, "rgba(55, 25, 20, 0.24)");
    scleraShadow.addColorStop(0.70, "rgba(85, 45, 35, 0.07)");
    scleraShadow.addColorStop(1, "rgba(250, 246, 237, 0)");
    ctx.fillStyle = scleraShadow;
    ctx.beginPath();
    ctx.moveTo(inX, inY);
    ctx.bezierCurveTo(inX + side * 24, topPeakY, topPeakX, topPeakY, outX, outY);
    ctx.bezierCurveTo(btmDipX, btmDipY, inX + side * 28, btmDipY, inX, inY);
    ctx.closePath();
    ctx.fill();

    // Inner canthus tear duct
    const tearDuct = ctx.createRadialGradient(inX, inY, 1, inX, inY, 8);
    tearDuct.addColorStop(0, "rgba(215, 95, 90, 0.65)");
    tearDuct.addColorStop(0.65, "rgba(195, 80, 80, 0.22)");
    tearDuct.addColorStop(1, "rgba(250, 246, 237, 0)");
    ctx.fillStyle = tearDuct;
    ctx.beginPath();
    ctx.arc(inX, inY, 8, 0, Math.PI * 2);
    ctx.fill();

    // B. Iris & Pupil (Clipped to Sclera)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(inX, inY);
    ctx.bezierCurveTo(inX + side * 24, topPeakY, topPeakX, topPeakY, outX, outY);
    ctx.bezierCurveTo(btmDipX, btmDipY, inX + side * 28, btmDipY, inX, inY);
    ctx.closePath();
    ctx.clip();

    const irisX = ex;
    const irisY = eyeY - 2;
    const irisRadius = 38;

    // Iris Outer Limbal Ring & Warm Amber/Chocolate Body
    const irisGrad = ctx.createRadialGradient(irisX, irisY, 4, irisX, irisY, irisRadius);
    irisGrad.addColorStop(0, "#5a2c14");
    irisGrad.addColorStop(0.55, "#3a190a");
    irisGrad.addColorStop(0.85, "#1a0a04");
    irisGrad.addColorStop(1, "#080301");
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(irisX, irisY, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fine golden-amber radial striations in iris
    ctx.strokeStyle = "rgba(190, 120, 50, 0.28)";
    ctx.lineWidth = 1.2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
      ctx.beginPath();
      ctx.moveTo(irisX + Math.cos(a) * 12, irisY + Math.sin(a) * 12);
      ctx.lineTo(irisX + Math.cos(a) * 32, irisY + Math.sin(a) * 32);
      ctx.stroke();
    }

    // Jet Black Pupil
    ctx.fillStyle = "#040404";
    ctx.beginPath();
    ctx.arc(irisX, irisY, 17, 0, Math.PI * 2);
    ctx.fill();

    // Lifelike Twin Catchlights
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.beginPath();
    ctx.arc(irisX - side * 8, irisY - 9, 5.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.arc(irisX + side * 11, irisY + 8, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // C. Double Eyelid Crease
    ctx.strokeStyle = "rgba(95, 42, 28, 0.38)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(inX + side * 14, eyeY - eyeHeight * 0.48);
    ctx.bezierCurveTo(topPeakX - side * 7, topPeakY - 11, topPeakX + side * 20, topPeakY - 8, outX - side * 8, eyeY - eyeHeight * 0.35);
    ctx.stroke();

    // D. Signature Dramatic Bharatanatyam Winged Kohl Kajal Eyeliner
    ctx.strokeStyle = "#080808";
    ctx.fillStyle = "#080808";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1. Lush Upper Winged Lash Line
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(inX, inY);
    ctx.bezierCurveTo(inX + side * 24, topPeakY, topPeakX, topPeakY, outX, outY);
    ctx.bezierCurveTo(outX + side * 20, outY - 5, outX + side * 40, outY - 15, outX + side * 58, outY - 26);
    ctx.stroke();

    // Wing fill triangle
    ctx.beginPath();
    ctx.moveTo(outX - side * 8, outY);
    ctx.lineTo(outX + side * 58, outY - 26);
    ctx.lineTo(outX + side * 26, outY + 2);
    ctx.closePath();
    ctx.fill();

    // 2. Lower Lash Line
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(inX + side * 10, inY + 4);
    ctx.bezierCurveTo(inX + side * 26, btmDipY + 2, btmDipX, btmDipY + 2, outX, outY);
    ctx.bezierCurveTo(outX + side * 16, outY - 3, outX + side * 34, outY - 8, outX + side * 50, outY - 20);
    ctx.stroke();

    ctx.restore();
  }

  // 8. Classical Bow-Shaped Eyebrows (Bhru Bhedas / Dhanurakara)
  for (const side of [-1, 1]) {
    ctx.save();
    const browInX = cx + side * 52;
    const browInY = 365;
    const browPeakX = cx + side * 165;
    const browPeakY = 328;
    const browTailX = cx + side * 290;
    const browTailY = 368;

    // Soft feather base
    ctx.strokeStyle = "rgba(40, 20, 14, 0.38)";
    ctx.lineWidth = 8.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(browInX + side * 6, browInY + 2);
    ctx.bezierCurveTo(browInX + side * 44, browPeakY + 4, browPeakX, browPeakY + 3, browTailX, browTailY + 3);
    ctx.stroke();

    // Deep Black Silken Brow Body
    ctx.strokeStyle = "#0e0c0b";
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(browInX, browInY);
    ctx.bezierCurveTo(browInX + side * 40, browPeakY, browPeakX, browPeakY, browTailX, browTailY);
    ctx.stroke();

    // Slender Tapered Outer Arch & Tail
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(browPeakX - side * 15, browPeakY - 1);
    ctx.bezierCurveTo(browPeakX + side * 40, browPeakY + 6, browPeakX + side * 78, browPeakY + 18, browTailX + side * 5, browTailY + 4);
    ctx.stroke();

    ctx.restore();
  }

  // 9. Sacred Ajna Chakra Forehead Adornment: Kumkum Bindi & Chandan
  if (sex === "female") {
    ctx.save();
    const bindiY = 338;
    const bindiRadius = 19.0;

    // Rich Velvet Crimson Red Kumkum Bindi
    const bindiGrad = ctx.createRadialGradient(cx - 3, bindiY - 4, 3, cx, bindiY, bindiRadius);
    bindiGrad.addColorStop(0, "#d41824");
    bindiGrad.addColorStop(0.65, "#a81119");
    bindiGrad.addColorStop(0.92, "#7a0a10");
    bindiGrad.addColorStop(1, "#520408");
    ctx.fillStyle = bindiGrad;
    ctx.beginPath();
    ctx.arc(cx, bindiY, bindiRadius, 0, Math.PI * 2);
    ctx.fill();

    // 24K Gold micro-rim around the bindi
    ctx.strokeStyle = "rgba(212, 175, 55, 0.50)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, bindiY, bindiRadius + 1.3, 0, Math.PI * 2);
    ctx.stroke();

    // Auspicious Ivory Chandan Crescent beneath Bindi
    ctx.strokeStyle = "#faf4e4";
    ctx.lineWidth = 3.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, bindiY + 26, 14, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

    // Central Chandan Pearl Drop
    ctx.fillStyle = "#faf4e4";
    ctx.beginPath();
    ctx.arc(cx, bindiY + 41, 5.0, 0, Math.PI * 2);
    ctx.fill();

    // Micro Kumkum bindu inside the Chandan drop
    ctx.fillStyle = "#a81119";
    ctx.beginPath();
    ctx.arc(cx, bindiY + 41, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else {
    // Sacred Tripundra (Three horizontal chandan lines)
    ctx.save();
    for (let i = -1; i <= 1; i++) {
      const lineY = 338 + i * 15;
      ctx.strokeStyle = "rgba(245, 238, 220, 0.88)";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 110, lineY);
      ctx.quadraticCurveTo(cx, lineY - 2, cx + 110, lineY);
      ctx.stroke();
    }
    // Central Kumkum red bindu in the Tripundra
    ctx.fillStyle = "#a81418";
    ctx.beginPath();
    ctx.arc(cx, 338, 9.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds the female hair and jewelry adornments:
 * - Natural classical hairline with smooth parted crown
 * - Graceful side hair sweeps framing temples and cheeks (Karnalata)
 * - Sculpted human ears with traditional temple Jhumkas
 * - Coiled Kondai bun at back of head with Mogra Gajra & Rakodi gold sun medallion
 * - Nethi Chutti (forehead temple jewelry & parting chain)
 */
function buildFemaleHairAndJewelry(
  mats: ReturnType<typeof createAdornmentMaterials>,
): THREE.Group {
  const group = new THREE.Group();
  group.name = "guru-hair-and-jewelry";

  // 1. Natural Classical Bharatanatyam Hair Cap with Sculpted Hairline (No bald dome)
  const hairGeo = new THREE.SphereGeometry(0.108, 64, 48);
  hairGeo.scale(1.025, 1.25, 1.32);

  const hPos = hairGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    let x = hPos.getX(i);
    let y = hPos.getY(i) + 0.118;
    let z = hPos.getZ(i) - 0.012;

    // In the front hemisphere (z < -0.02)
    if (z < -0.02) {
      // Natural classical hairline curve:
      // Center part at x = 0 is at y = 0.162 (3.8 cm above eyes)
      // Curves down past temples to y = 0.130 at x = ±0.065
      // Curves down past ears to y = 0.100 at x = ±0.095
      const hairlineY = 0.162 - Math.pow(x / 0.075, 2) * 0.035;

      // If vertex is below the hairline, clamp it up to the hairline
      if (y < hairlineY && y > 0.01) {
        y = hairlineY;
        hPos.setY(i, y - 0.118);
        // Pull slightly forward to form a clean, thick, natural hairline edge
        z -= 0.003;
        hPos.setZ(i, z + 0.012);
      }
    }
  }
  hairGeo.computeVertexNormals();

  const hairCap = new THREE.Mesh(hairGeo, mats.hair);
  hairCap.position.set(0, 0.118, -0.012);
  group.add(hairCap);

  // Side hair masses framing temples (giving full, thick Indian hair volume)
  for (const side of [-1, 1]) {
    const sideMass = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 12), mats.hair);
    sideMass.scale.set(0.5, 1.4, 1.0);
    sideMass.position.set(side * 0.092, 0.138, -0.035);
    sideMass.rotation.z = side * 0.18;
    group.add(sideMass);
  }

  // 2. Sculpted Human Ears with Temple Jhumkas
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    const earX = side * 0.098;
    const earY = 0.105;
    const earZ = -0.005;

    // Outer Ear Helix (curved cartilage rim)
    const earCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.016, -0.004),
      new THREE.Vector3(side * 0.006, 0.010, 0.003),
      new THREE.Vector3(side * 0.008, -0.002, 0.006),
      new THREE.Vector3(side * 0.004, -0.014, 0.004),
      new THREE.Vector3(0, -0.018, 0.000),
    ]);
    const earHelixGeo = new THREE.TubeGeometry(earCurve, 12, 0.0035, 6, false);
    const earHelix = new THREE.Mesh(earHelixGeo, mats.earSkin);
    earGroup.add(earHelix);

    // Ear Lobule
    const lobeGeo = new THREE.SphereGeometry(0.0055, 10, 8);
    lobeGeo.scale(0.8, 1.2, 0.7);
    const earLobe = new THREE.Mesh(lobeGeo, mats.earSkin);
    earLobe.position.set(side * 0.002, -0.016, 0.002);
    earGroup.add(earLobe);

    // Temple Jhumkas / Jimikki (Bell-shaped earrings hanging from lobule)
    const studGeo = new THREE.CylinderGeometry(0.0055, 0.0065, 0.002, 12);
    studGeo.rotateZ(Math.PI / 2);
    const stud = new THREE.Mesh(studGeo, mats.templeGold);
    stud.position.set(side * 0.003, -0.016, 0.002);
    earGroup.add(stud);

    const studGemGeo = new THREE.SphereGeometry(0.0026, 8, 6);
    const studGem = new THREE.Mesh(studGemGeo, mats.rubyKemp);
    studGem.position.set(side * 0.005, -0.016, 0.002);
    earGroup.add(studGem);

    // Hanging Bell (Jhumka dome)
    const jhumkaGeo = new THREE.ConeGeometry(0.009, 0.012, 14, 1, true);
    const jhumka = new THREE.Mesh(jhumkaGeo, mats.templeGold);
    jhumka.rotation.z = Math.PI;
    jhumka.position.set(side * 0.003, -0.030, 0.002);
    earGroup.add(jhumka);

    // Hanging gold droplet bead inside the jhumka
    const dropBeadGeo = new THREE.SphereGeometry(0.0032, 8, 6);
    const dropBead = new THREE.Mesh(dropBeadGeo, mats.templeGold);
    dropBead.position.set(side * 0.003, -0.038, 0.002);
    earGroup.add(dropBead);

    earGroup.position.set(earX, earY, earZ);
    group.add(earGroup);
  }

  // 3. Classical Hair Bun (Kondai) at back of head (+Z)
  const bunGeo = new THREE.SphereGeometry(0.065, 24, 20);
  bunGeo.scale(1.0, 0.9, 0.8);
  const bunMesh = new THREE.Mesh(bunGeo, mats.hair);
  bunMesh.position.set(0, 0.135, 0.130);
  group.add(bunMesh);

  // Concentric hair coils on the bun
  const coilGeo1 = new THREE.TorusGeometry(0.046, 0.010, 10, 24);
  const coil1 = new THREE.Mesh(coilGeo1, mats.hair);
  coil1.position.set(0, 0.135, 0.148);
  group.add(coil1);

  const coilGeo2 = new THREE.TorusGeometry(0.024, 0.009, 10, 20);
  const coil2 = new THREE.Mesh(coilGeo2, mats.hair);
  coil2.position.set(0, 0.135, 0.152);
  group.add(coil2);

  // 4. Rakodi (Traditional gold circular jewel pinned to center of the Kondai)
  const rakodiGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.005, 16);
  rakodiGeo.rotateX(Math.PI / 2);
  const rakodi = new THREE.Mesh(rakodiGeo, mats.templeGold);
  rakodi.position.set(0, 0.135, 0.156);
  group.add(rakodi);

  const rakodiGemGeo = new THREE.SphereGeometry(0.007, 12, 10);
  const rakodiGem = new THREE.Mesh(rakodiGemGeo, mats.rubyKemp);
  rakodiGem.position.set(0, 0.135, 0.160);
  group.add(rakodiGem);

  // 5. Mogra Gajra (Fresh double jasmine blossom garland encircling the Kondai)
  const gajraRingGeo1 = new THREE.TorusGeometry(0.064, 0.012, 12, 28);
  const gajra1 = new THREE.Mesh(gajraRingGeo1, mats.mograJasmine);
  gajra1.position.set(0, 0.135, 0.124);
  group.add(gajra1);

  const gajraRingGeo2 = new THREE.TorusGeometry(0.052, 0.010, 10, 24);
  const gajra2 = new THREE.Mesh(gajraRingGeo2, mats.mograJasmine);
  gajra2.position.set(0, 0.135, 0.138);
  group.add(gajra2);

  // 6. Nethi Chutti / Maang Tikka (Forehead temple jewelry)
  const chainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.252, -0.035),
    new THREE.Vector3(0, 0.230, -0.080),
    new THREE.Vector3(0, 0.205, -0.118),
    new THREE.Vector3(0, 0.170, -0.138),
  ]);
  const chainGeo = new THREE.TubeGeometry(chainCurve, 16, 0.002, 6, false);
  const partingChain = new THREE.Mesh(chainGeo, mats.templeGold);
  group.add(partingChain);

  // Pendant Medallion hanging right at the natural hairline
  const pendantBaseGeo = new THREE.CylinderGeometry(0.008, 0.010, 0.003, 16);
  pendantBaseGeo.rotateX(Math.PI / 2);
  const pendantBase = new THREE.Mesh(pendantBaseGeo, mats.templeGold);
  pendantBase.position.set(0, 0.166, -0.138);
  group.add(pendantBase);

  const rubyGeo = new THREE.SphereGeometry(0.0042, 12, 10);
  const pendantRuby = new THREE.Mesh(rubyGeo, mats.rubyKemp);
  pendantRuby.position.set(0, 0.166, -0.141);
  group.add(pendantRuby);

  const dropGeo = new THREE.SphereGeometry(0.0022, 10, 8);
  dropGeo.scale(1.0, 1.4, 1.0);
  const goldDrop = new THREE.Mesh(dropGeo, mats.templeGold);
  goldDrop.position.set(0, 0.157, -0.140);
  group.add(goldDrop);

  return group;
}

/**
 * Builds the male hair and jewelry adornments:
 * - Classical topknot / bun (Shikha / Kondai)
 * - Full natural hairline
 * - Sculpted human ears with traditional gold Kundalas (earring hoops)
 */
function buildMaleHairAndJewelry(
  mats: ReturnType<typeof createAdornmentMaterials>,
): THREE.Group {
  const group = new THREE.Group();
  group.name = "guru-male-hair";

  // 1. Classical Male Topknot Bun (coiled at upper crown)
  const bunGeo = new THREE.SphereGeometry(0.048, 16, 14);
  bunGeo.scale(1.0, 0.85, 0.95);
  const bun = new THREE.Mesh(bunGeo, mats.hair);
  bun.position.set(0, 0.260, 0.025);
  group.add(bun);

  // Hair base with natural hairline
  const hairGeo = new THREE.SphereGeometry(0.108, 48, 36);
  hairGeo.scale(1.025, 1.25, 1.32);
  const hPos = hairGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    let x = hPos.getX(i);
    let y = hPos.getY(i) + 0.118;
    let z = hPos.getZ(i) - 0.012;
    if (z < -0.02) {
      const hairlineY = 0.165 - Math.pow(x / 0.080, 2) * 0.035;
      if (y < hairlineY && y > 0.01) {
        y = hairlineY;
        hPos.setY(i, y - 0.118);
        z -= 0.003;
        hPos.setZ(i, z + 0.012);
      }
    }
  }
  hairGeo.computeVertexNormals();
  const hairCap = new THREE.Mesh(hairGeo, mats.hair);
  hairCap.position.set(0, 0.118, -0.012);
  group.add(hairCap);

  // Golden cord / band tying the topknot
  const cordGeo = new THREE.TorusGeometry(0.040, 0.0035, 8, 20);
  const cord = new THREE.Mesh(cordGeo, mats.templeGold);
  cord.position.set(0, 0.235, 0.025);
  cord.rotation.x = Math.PI / 2;
  group.add(cord);

  // 2. Sculpted Human Ears with Traditional Golden Kundalas
  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    const earX = side * 0.098;
    const earY = 0.105;
    const earZ = -0.005;

    const earCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.016, -0.004),
      new THREE.Vector3(side * 0.006, 0.010, 0.003),
      new THREE.Vector3(side * 0.008, -0.002, 0.006),
      new THREE.Vector3(side * 0.004, -0.014, 0.004),
      new THREE.Vector3(0, -0.018, 0.000),
    ]);
    const earHelixGeo = new THREE.TubeGeometry(earCurve, 12, 0.0035, 6, false);
    const earHelix = new THREE.Mesh(earHelixGeo, mats.earSkin);
    earGroup.add(earHelix);

    const lobeGeo = new THREE.SphereGeometry(0.0055, 10, 8);
    lobeGeo.scale(0.8, 1.2, 0.7);
    const earLobe = new THREE.Mesh(lobeGeo, mats.earSkin);
    earLobe.position.set(side * 0.002, -0.016, 0.002);
    earGroup.add(earLobe);

    const kundalaGeo = new THREE.TorusGeometry(0.007, 0.0025, 8, 16);
    const kundala = new THREE.Mesh(kundalaGeo, mats.templeGold);
    kundala.position.set(side * 0.003, -0.018, 0.002);
    kundala.rotation.y = Math.PI / 2;
    earGroup.add(kundala);

    earGroup.position.set(earX, earY, earZ);
    group.add(earGroup);
  }

  return group;
}

/**
 * Builds the curved 3D face mesh that wraps naturally over the skull contour,
 * textured with the high-resolution classical Bharatanatyam face canvas.
 *
 * Conformal vertex formula:
 * Evaluates the exact mathematical surface of the front skull:
 * Z_skull(x, y) = -0.154 + (y - 0.090)^2 * 2.8 + x^2 * 5.4
 * Offsetting by -0.0035m (3.5mm forward in -Z) ensures the face mesh is
 * perfectly flush with the front of the head and is never clipped or buried
 * by the skull at any point.
 */
function buildGuruFaceMesh(sex: Sex): THREE.Mesh {
  const width = 0.165;
  const height = 0.185;
  const segX = 36;
  const segY = 36;
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);

  // Invert winding order so normals face outward along -Z (toward the camera and lights)
  const indexAttr = geo.getIndex();
  if (indexAttr) {
    const indices = indexAttr.array;
    for (let i = 0; i < indices.length; i += 3) {
      const tmp = indices[i];
      indices[i] = indices[i + 1];
      indices[i + 1] = tmp;
    }
  }

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);

    const hy = 0.092 + vy;
    const hx = vx;

    // Conformal mapping to skull front surface
    const dy = hy - 0.090;
    const zSkull = -0.154 + (dy * dy) * 2.8 + (hx * hx) * 5.4;
    const vz = zSkull - 0.0035;

    pos.setZ(i, vz);
  }
  geo.computeVertexNormals();

  const faceTexture = createGuruFaceCanvasTexture(sex);

  const mat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    transparent: true,
    roughness: 0.46,
    metalness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false, // Prevents z-fighting with the underlying skull mesh
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -2.0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0.092, 0);
  mesh.renderOrder = 10;
  return mesh;
}

/**
 * Builds authentic Bharatanatyam facial details:
 * Conformal curved face mesh with high-res expressive facial features,
 * warm encouraging Guru smile, winged kajal eyes, and auspicious bindi.
 */
function buildFacialDetails(
  sex: Sex,
  _mats: ReturnType<typeof createAdornmentMaterials>,
): THREE.Group {
  const group = new THREE.Group();
  group.name = "guru-facial-details";

  const faceMesh = buildGuruFaceMesh(sex);
  group.add(faceMesh);

  return group;
}

/**
 * Builds authentic Ghungroos (Ankle Bells):
 * Red padded leather strap with rows of polished brass bells around each ankle.
 */
function buildGhungroos(
  mats: ReturnType<typeof createAdornmentMaterials>,
): { left: THREE.Group; right: THREE.Group } {
  const createAnkleGhungroo = (sideName: "L" | "R") => {
    const group = new THREE.Group();
    group.name = `ghungroo-${sideName}`;

    // 1. Red velvet-leather backing strap (Padam) around ankle
    const strapGeo = new THREE.CylinderGeometry(0.048, 0.052, 0.038, 20, 1, true);
    const strap = new THREE.Mesh(strapGeo, mats.ghungrooPad);
    group.add(strap);

    // 2. Rows of golden brass bells (Ghungroo)
    const bellCount = 14;
    const bellRadius = 0.0065;
    const bellGeo = new THREE.SphereGeometry(bellRadius, 10, 8);
    bellGeo.scale(1.0, 0.9, 1.0);

    for (let row = -1; row <= 1; row += 2) {
      const rowY = row * 0.011;
      const ringRadius = 0.051;
      for (let i = 0; i < bellCount; i++) {
        const angle = (i / bellCount) * Math.PI * 2;
        const bell = new THREE.Mesh(bellGeo, mats.ghungrooBell);
        bell.position.set(
          Math.cos(angle) * ringRadius,
          rowY,
          Math.sin(angle) * ringRadius,
        );
        group.add(bell);
      }
    }

    return group;
  };

  return {
    left: createAnkleGhungroo("L"),
    right: createAnkleGhungroo("R"),
  };
}

/**
 * Adorns the 3D Guru avatar with full authentic Bharatanatyam details:
 * - Attaches hair, gajra, temple jewelry, and facial detailing to the Head bone.
 * - Attaches ankle ghungroos to the Shin bones.
 * All added geometries and materials are tracked under the figure hierarchy and
 * cleaned up seamlessly by `disposeFigure`.
 */
export function adornGuru(mesh: THREE.SkinnedMesh, sex: Sex) {
  const bones = new Map<string, THREE.Bone>();
  for (const b of mesh.skeleton.bones) {
    bones.set(b.name.replace(/_\d+$/, "").replace(/[.\s]/g, ""), b);
  }

  const head = bones.get("Head");
  if (!head) {
    console.warn("adornGuru: Head bone not found on skeleton");
    return;
  }

  const mats = createAdornmentMaterials();

  // 1. Hair and Temple Jewelry (Centered at X = 0 on the head bone)
  const hairAndJewelry = sex === "female"
    ? buildFemaleHairAndJewelry(mats)
    : buildMaleHairAndJewelry(mats);
  head.add(hairAndJewelry);

  // 2. Facial Detailing (Winged eyes, kohl, eyebrows, bindi/tilak, lips)
  const facialDetails = buildFacialDetails(sex, mats);
  head.add(facialDetails);

  // 3. Ankle Ghungroos (Attached to shin bones right above ankle joint)
  const shinL = bones.get("ShinL");
  const shinR = bones.get("ShinR");
  const { left: ghungrooL, right: ghungrooR } = buildGhungroos(mats);

  if (shinL) {
    ghungrooL.position.set(0, 0.44, 0);
    shinL.add(ghungrooL);
  }
  if (shinR) {
    ghungrooR.position.set(0, 0.44, 0);
    shinR.add(ghungrooR);
  }

  // Ensure matrix world propagates down the newly added children
  head.updateMatrixWorld(true);
  if (shinL) shinL.updateMatrixWorld(true);
  if (shinR) shinR.updateMatrixWorld(true);
}
