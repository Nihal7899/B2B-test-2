import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, AlertCircle, Globe } from 'lucide-react';

// ============================================================================
// WEBGPU SHADER & CONSTANTS
// ============================================================================

const SHADER_SOURCE = `
struct Uniforms {
  size:           vec2<f32>, time:           f32, speed:          f32, radius:         f32,
  zoom:           f32, warp:           f32, ridgeAmt:       f32, sharp:          f32,
  shade:          f32, sheen:          f32, gloss:          f32, shellMidAlpha:  f32,
  shellEdgeAlpha: f32, exposure:       f32, style:          f32, edgeSoftness:   f32,
  edgeGlow:       f32, paletteCount:   f32, glassEnabled:   f32, glassOpacity:   f32,
  contourDeform:  f32, bandDensity:    f32, chromaticShift: f32, metalScale:     f32,
  metalStretch:   f32, metalAngle:     f32, metalOffset:    f32, metalPhase:     f32,
  metalEvolution: f32, metalRoughness: f32, metalDepth:     f32, particleDensity: f32,
  ribbonCount:     f32, ribbonWidth:     f32, ribbonTwist:     f32, ribbonFold:      f32,
  ribbonBreath:    f32, particleSize:    f32, particleBloom:   f32, colorA:         vec4<f32>,
  colorB:         vec4<f32>, colorC:         vec4<f32>, colorD:         vec4<f32>, highlightColor: vec4<f32>,
  shellInner:     vec4<f32>, shellMid:       vec4<f32>, shellEdge:      vec4<f32>, sheenColor:     vec4<f32>,
  specColor:      vec4<f32>, canvasColor:    vec4<f32>, glowColor:      vec4<f32>, paletteStop0:    vec4<f32>,
  paletteStop1:    vec4<f32>, paletteStop2:    vec4<f32>, paletteStop3:    vec4<f32>, paletteStop4:    vec4<f32>,
  paletteStop5:    vec4<f32>, paletteStop6:    vec4<f32>, paletteStop7:    vec4<f32>, paletteStop8:    vec4<f32>,
  paletteStop9:    vec4<f32>, paletteStop10:   vec4<f32>, paletteStop11:   vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

fn mfEdgeD(soft: f32) -> f32 { return soft - 0.005; }
fn mfEdgeGlow(col: vec3<f32>, uv: vec2<f32>, ctr: vec2<f32>, rad: f32, soft: f32, glow: f32, glowRGB: vec3<f32>) -> vec3<f32> {
  if (glow <= 0.0) { return col; }
  let r = length(uv - ctr);
  let outside = smoothstep(rad - max(soft, 0.0005), rad + max(soft, 0.0005), r);
  return col + glowRGB * (glow * exp(-max(r - rad, 0.0) * 11.0) * outside);
}
fn glsOver(dst: vec3<f32>, src: vec3<f32>, a: f32) -> vec3<f32> {
  let k = clamp(a, 0.0, 1.0); return src * k + dst * (1.0 - k);
}
const GL_FU: f32 = 0.88172043;
const GL_BSIG_CLEAR: f32 = 0.018;
const GL_BSIG_GLASS: f32 = 0.0399;
const GL_KA: f32 = 6.0;
const GL_KG: f32 = 4.1209;
const GL_KWA: f32 = 0.5;
const GL_KR: f32 = 0.32;
const GL_GH: f32 = 1.73205081;
const GL_CLEAR_EA: f32 = 0.995;
const GL_CLEAR_EB: f32 = 1.04;

fn lqHash(pIn: vec2<f32>) -> f32 {
  var p = fract(pIn * vec2<f32>(123.34, 456.21));
  p = p + vec2<f32>(dot(p, p + vec2<f32>(45.32)));
  return fract(p.x * p.y);
}
fn lqNoise(p: vec2<f32>) -> f32 {
  let i = floor(p); var f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lqHash(i), lqHash(i + vec2<f32>(1.0, 0.0)), f.x),
             mix(lqHash(i + vec2<f32>(0.0, 1.0)), lqHash(i + vec2<f32>(1.0, 1.0)), f.x), f.y);
}
fn lqFbm(pIn: vec2<f32>, bs: f32) -> vec2<f32> {
  var p = pIn; var s: f32 = 0.0; var a: f32 = 0.5; var m: f32 = 0.0; var vr: f32 = 0.0;
  let e = -GL_KA * bs * bs; var g: f32 = 1.0;
  for (var i: i32 = 0; i < 5; i = i + 1) {
    let b = exp(e * g);
    s = s + a * (0.5 + b * (lqNoise(p) - 0.5));
    vr = vr + a * a * (1.0 - b * b); m = m + a; a = a * 0.5; g = g * GL_KG;
    p = vec2<f32>(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03;
  }
  return vec2<f32>(s / m, GL_KR * sqrt(vr) / m);
}

fn glsFinishPresetFluid(colorIn: vec3<f32>, p: vec2<f32>) -> vec3<f32> {
  var color = colorIn;
  color = mix(color, u.highlightColor.rgb, u.shade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2<f32>(-0.32, 0.78))));
  color = color * (1.0 - u.shade * 0.34 * smoothstep(-0.1, 1.2, dot(p, vec2<f32>(0.45, -0.62))));
  color = color * (1.0 - u.shade * 0.22 * smoothstep(0.72, 1.08, length(p)));
  return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn glsVoiceWaveFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let scale = 0.76 + u.zoom * 0.34; let q = p / scale;
  let rimEnvelope = pow(max(1.0 - q.x * q.x, 0.0), 0.72);
  let drift = t * 0.82; let amplitude = 0.2 + u.warp * 0.018;
  let mainY = rimEnvelope * (amplitude * sin(q.x * 1.48 + drift) + 0.055 * sin(q.x * 3.2 - drift * 0.43 + 1.1));
  let distance = q.y - mainY; let width = 0.11 + (1.0 - u.ridgeAmt) * 0.075;
  let membrane = exp(-distance * distance / max(width * width, 0.001)) * rimEnvelope;
  let upperVeil = exp(-(distance - 0.105) * (distance - 0.105) / max(width * width * 2.4, 0.001)) * rimEnvelope;
  let lowerVeil = exp(-(distance + 0.115) * (distance + 0.115) / max(width * width * 2.8, 0.001)) * rimEnvelope;
  let crest = exp(-distance * distance / 0.0026) * rimEnvelope;
  let depth = sqrt(max(1.0 - clamp(dot(p, p), 0.0, 1.0), 0.0));
  var color = mix(u.colorA.rgb * 0.7, u.colorD.rgb * 0.34, smoothstep(-0.82, 0.82, q.y));
  color = mix(color, u.colorB.rgb, upperVeil * 0.7);
  color = mix(color, u.colorC.rgb, lowerVeil * 0.62);
  color = color + mix(u.colorB.rgb, u.colorC.rgb, 0.46) * membrane * 0.34;
  color = color + u.highlightColor.rgb * crest * 0.14;
  color = color * (0.58 + 0.42 * depth);
  return glsFinishPresetFluid(color, p);
}

fn glsContourScale(uv: vec2<f32>, t: f32, amount: f32) -> f32 { return 1.0; }

fn orbGlassLiquidAnim(uv01: vec2<f32>) -> vec4<f32> {
  let fc = vec2<f32>(uv01.x, 1.0 - uv01.y) * u.size;
  let uv = (2.0 * fc - u.size) / max(min(u.size.x, u.size.y), 1.0);
  let rad = max(u.radius, 0.05); let t = u.time * u.speed;
  let contourRad = rad * glsContourScale(uv, t, u.contourDeform);
  
  if (length(uv) > contourRad * (1.01 + mfEdgeD(u.edgeSoftness))) {
    let halo = clamp(mfEdgeGlow(vec3<f32>(0.0), uv, vec2<f32>(0.0), contourRad, u.edgeSoftness, u.edgeGlow, u.glowColor.rgb), vec3<f32>(0.0), vec3<f32>(1.0));
    return vec4<f32>(halo, max(halo.r, max(halo.g, halo.b)));
  }

  let p = uv / contourRad; let pd = length(p);
  let clearFa = 1.0 - smoothstep(GL_CLEAR_EA, GL_CLEAR_EB, pd);
  var fcol = vec3<f32>(0.0);
  if (clearFa > 0.0) { fcol = glsVoiceWaveFluid(p, t); }

  let lum = dot(fcol, vec3<f32>(0.213, 0.715, 0.072));
  let clearSat = clamp(vec3<f32>(lum) + (fcol - vec3<f32>(lum)) * 1.22, vec3<f32>(0.0), vec3<f32>(1.0));
  var col = glsOver(u.canvasColor.rgb, clearSat, 0.99 * clearFa);

  let ballA = 1.0 - smoothstep(0.99 - mfEdgeD(u.edgeSoftness), 1.01 + mfEdgeD(u.edgeSoftness), pd);
  col = clamp(col * max(u.exposure, 0.0), vec3<f32>(0.0), vec3<f32>(1.0)) * ballA;
  let edged = mfEdgeGlow(col, uv, vec2<f32>(0.0), contourRad, u.edgeSoftness, u.edgeGlow, u.glowColor.rgb);
  let finalColor = clamp(edged, vec3<f32>(0.0), vec3<f32>(1.0));
  return vec4<f32>(finalColor, clamp(max(ballA, max(finalColor.r, max(finalColor.g, finalColor.b))), 0.0, 1.0));
}

struct VOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> };

@vertex fn vs_main(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>( 3.0, -1.0), vec2<f32>(-1.0,  3.0));
  var out: VOut; out.pos = vec4<f32>(p[i], 0.0, 1.0);
  let uv01 = (p[i] + vec2<f32>(1.0)) * 0.5; out.uv = vec2<f32>(uv01.x, 1.0 - uv01.y);
  return out;
}

@fragment fn fs_main(in: VOut) -> @location(0) vec4<f32> {
  let c = orbGlassLiquidAnim(in.uv);
  let fc = vec2<f32>(in.uv.x, 1.0 - in.uv.y) * u.size;
  let q = (2.0 * fc - u.size) / u.size;
  let fit = 1.0 - smoothstep(min(u.radius, 1.0) - 2.0 / max(min(u.size.x, u.size.y), 1.0), 1.0, max(abs(q.x), abs(q.y)));
  return vec4<f32>(c.rgb * fit, c.a * fit);
}
`;

// Original uniform seeds overridden with Dark Green logic
const RAW_STATE = [1, 1, 0, 0.27, 0.74, 0.446, 1.325, 0.193, 1.968, 0.16, 0.22, 0.42, 0.32, 0.24, 0.818, 
  19, // Index 15: Style 19 (Voice Wave)
  0.005, 0, 0, 1, 0.66, 0.028, 2, 0.42, 0.77, 0.23, 65, 0, 0, 1, 0.22, 0.25, 0.72, 5, 0.42, 1.25, 0.55, 0.3, 1.2, 0.7, 
  // Colors 40-55: Dark Green Gradient
  0.01, 0.20, 0.10, 1.0, // colorA
  0.02, 0.35, 0.18, 1.0, // colorB
  0.05, 0.50, 0.28, 1.0, // colorC
  0.10, 0.70, 0.40, 1.0, // colorD
  // 56-59 Highlight 
  0.64, 0.85, 0.75, 1.0, 
  // 60-63 Canvas Color (Pure White for Modal bg)
  1.0, 1.0, 1.0, 1.0, 
  1, 1, 0.3, 0.84, 1, 1, 0.27, 0.42, 1, 1, 0.86, 0.98, 1, 1, 0.65, 0.85, 1, 1, 0.003, 0.007, 0.027, 1, 0.12, 0.31, 0.46, 1, 0.96, 0.98, 1, 1, 0.93, 0.96, 0.99, 1, 0.87, 0.93, 0.97, 1, 0.83, 0.90, 0.96, 1, 0.73, 0.83, 0.95, 1, 0.65, 0.78, 0.94, 1, 0.52, 0.69, 0.92, 1, 0.43, 0.61, 0.90, 1, 0.43, 0.61, 0.90, 1, 0.43, 0.61, 0.90, 1, 0.43, 0.61, 0.90, 1, 0.43, 0.61, 0.90, 1
];

const AUDIO_RULES = [[3,"all",0,0.7,5],[6,"mid",0.85,0,7],[21,"low",0.075,0,1],[10,"high",0.16,0,2],[14,"all",0,0.12,4]];

// ============================================================================
// COMPONENT
// ============================================================================

interface VoiceSearchModalProps {
  open: boolean;
  onClose: () => void;
  isListening: boolean;
  error: string | null;
  transcript: string;
  onRetry: () => void;
  onConfirm: (text: string) => void;
  lang?: string;
}

export function VoiceSearchModal({
  open,
  onClose,
  isListening,
  error,
  transcript,
  onRetry,
  lang = 'en-IN',
}: VoiceSearchModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGpuSupported, setWebGpuSupported] = useState(true);

  // WebGPU Engine & Animation Loop
  useEffect(() => {
    if (!open || !canvasRef.current || !webGpuSupported) return;

    let stopped = false;
    let animationFrame = 0;
    let device: GPUDevice | null = null;
    let lastFrameAt: number | null = null;
    let motionPhase = 0;

    const values = new Float32Array(RAW_STATE);

    async function initWebGPU() {
      try {
        if (!navigator.gpu) throw new Error("WebGPU not supported");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("No adapter");
        device = await adapter.requestDevice();
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("No WebGPU context");

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: "premultiplied" });
        const shader = device.createShaderModule({ code: SHADER_SOURCE });

        const pipeline = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: shader, entryPoint: "vs_main" },
          fragment: {
            module: shader,
            entryPoint: "fs_main",
            targets: [{
              format,
              blend: {
                color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
                alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
              },
            }],
          },
          primitive: { topology: "triangle-list" },
        });

        const uniformBuffer = device.createBuffer({
          size: values.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });

        function frame(now: number) {
          if (stopped) return;
          try {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
            const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
            
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width; canvas.height = height;
            }

            const frameDelta = lastFrameAt === null ? 0 : Math.min(0.1, Math.max(0, (now - lastFrameAt) / 1000));
            lastFrameAt = now;

            // Audio band simulation for voice movement
            if (isListening && !error) {
              const t = now / 150;
              const pulse = Math.sin(t) * 0.5 + 0.5;
              const bands = {
                low: pulse * 0.8 + Math.random() * 0.2,
                mid: Math.cos(t * 1.3) * 0.5 + 0.5,
                high: Math.sin(t * 2.1) * 0.4 + 0.4,
                all: pulse * 0.6 + 0.2
              };
              for (const [idx, band, additive, prop, ceil] of AUDIO_RULES) {
                const level = Math.max(0, Math.min(1, bands[band as keyof typeof bands]));
                if (level) {
                  values[idx as number] = Math.min(
                    Math.max(ceil as number, values[idx as number]), 
                    values[idx as number] * (1 + (prop as number) * level) + (additive as number) * level
                  );
                }
              }
            } else {
              values.set(RAW_STATE); // reset to idle
            }

            motionPhase += frameDelta * Math.max(values[3], 0);
            values[0] = width; values[1] = height;
            values[2] = motionPhase / Math.max(values[3], 0.001);
            
            device!.queue.writeBuffer(uniformBuffer, 0, values);

            const encoder = device!.createCommandEncoder();
            const pass = encoder.beginRenderPass({
              colorAttachments: [{
                view: context!.getCurrentTexture().createView(),
                clearValue: { r: 1, g: 1, b: 1, a: 0 },
                loadOp: "clear",
                storeOp: "store",
              }],
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
            device!.queue.submit([encoder.finish()]);

            animationFrame = requestAnimationFrame(frame);
          } catch (e) {
            console.error("WebGPU render error:", e);
            setWebGpuSupported(false);
          }
        }
        animationFrame = requestAnimationFrame(frame);
      } catch (e) {
        console.warn("Falling back to standard mic view:", e);
        setWebGpuSupported(false);
      }
    }

    initWebGPU();

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      device?.destroy();
    };
  }, [open, isListening, error, webGpuSupported]);

  // Handle modal lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const trimmedTranscript = transcript.trim();
  const hasTranscript = trimmedTranscript.length > 0;
  const showError = Boolean(error);

  const title = showError ? 'Voice Search Failed' : isListening ? 'Listening…' : hasTranscript ? trimmedTranscript : 'Tap to speak';
  const subtitle = showError ? error : hasTranscript ? 'Searching...' : "Tell us what you're looking for,\nwe'll find it for you.";

  // Static Fallback layout if WebGPU fails
  const WAVE_BARS_LEFT = [{ h: 6, delay: 0.1 }, { h: 14, delay: 0.3 }, { h: 26, delay: 0.5 }, { h: 16, delay: 0.2 }, { h: 22, delay: 0.4 }];
  const WAVE_BARS_RIGHT = [...WAVE_BARS_LEFT].reverse();

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200" />

      <div
        className="relative w-full max-w-[340px] h-[340px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close voice search" className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 transition-all z-20 flex items-center justify-center">
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6 pt-4 pb-12">
          
          <div className="flex items-center justify-center gap-4 h-[130px] w-full transition-transform duration-200">
            {webGpuSupported ? (
              /* New WebGPU Canvas */
              <canvas 
                ref={canvasRef} 
                onClick={onRetry}
                aria-label="Animated liquid voice wave"
                className={`w-[180px] h-[180px] cursor-pointer hover:scale-[1.02] active:scale-95 transition-all z-20 ${showError ? 'grayscale opacity-70' : ''}`} 
              />
            ) : (
              /* Fallback Static HTML Mic View */
              <>
                <div className={`flex items-center gap-1.5 transition-opacity ${isListening && !showError ? 'opacity-100' : 'opacity-0'}`}>
                  {WAVE_BARS_LEFT.map((b, i) => <div key={`l-${i}`} className="w-1 rounded-full bg-[#0d5235] animate-pulse" style={{ height: b.h, animationDelay: `${b.delay}s` }}

                </div>
                <div onClick={onRetry} className={`relative flex items-center justify-center w-[68px] h-[68px] rounded-full shadow-lg cursor-pointer transition-all ${showError ? 'bg-red-600' : 'bg-[#0d5235] animate-pulse'}`}>
                  {showError ? <AlertCircle size={28} className="text-white" /> : isListening ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
                </div>
                <div className={`flex items-center gap-1.5 transition-opacity ${isListening && !showError ? 'opacity-100' : 'opacity-0'}`}>
                  {WAVE_BARS_RIGHT.map((b, i) => <div key={`r-${i}`} className="w-1 rounded-full bg-[#0d5235] animate-pulse" style={{ height: b.h, animationDelay: \`\${b.delay}s\` }} />)}
                </div>
              </>
            )}
          </div>

          <h2 className="mt-4 text-[24px] font-bold text-[#112c22] tracking-tight text-center">{title}</h2>
          <p className="mt-2 text-[14px] font-medium text-[#4f6b5f] text-center leading-relaxed whitespace-pre-line">{subtitle}</p>

          <div className="mt-5 flex items-center gap-1.5 bg-[#e8f6f1] px-4 py-1.5 rounded-full text-[#0d5235]">
            <Globe size={14} strokeWidth={2.2} />
            <span className="text-[13px] font-semibold">{lang === 'en-IN' ? 'English (India)' : lang}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
