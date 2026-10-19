# Local GPU image generation (ComfyUI) + playing from your phone

Your PC does the heavy lifting; your phone is just a browser.

```
Phone ──(Wi-Fi or Tailscale)──▶ PC: Edgerunn :3000 ──(localhost)──▶ ComfyUI :8188 (GPU)
```

ComfyUI stays private on the PC. Only the Edgerunn server talks to it.

## 1. ComfyUI on the PC (Windows + NVIDIA)

1. Install **ComfyUI Desktop** from <https://comfy.org/download>, or unzip the Windows portable build from the ComfyUI GitHub releases and run `run_nvidia_gpu.bat`.
2. Put at least one SDXL checkpoint (`.safetensors` only, never `.ckpt`/`.pt`) in `ComfyUI/models/checkpoints/`.
3. Open <http://127.0.0.1:8188>, queue the default workflow once to confirm it renders.

**8GB cards (3060 Ti / 3070 / 4060):** SDXL works; ComfyUI offloads automatically. Expect ~15–30s at 832×1216. If you hit out-of-memory errors, launch ComfyUI with `--lowvram`, or use the smaller "Portrait (512×768)" frame / an SD1.5 model. Skip Flux on 8GB.

**Pony-based models** (e.g. CyberRealistic Pony) want `score_9, score_8_up, score_7_up,` at the start of the prompt.

## 2. Edgerunn on the PC

1. Install [Node.js](https://nodejs.org) LTS, clone this repo, then in the repo folder:
   ```
   npm install
   copy .env.example .env
   ```
2. In `.env` set `GEMINI_API_KEY`. Leave `COMFYUI_URL` empty: Edgerunn finds ComfyUI on port 8188 (portable) or 8000 (ComfyUI Desktop) by itself.
3. `npm run dev` — Edgerunn now listens on port 3000 on every network interface.
4. When Windows Firewall asks, allow Node.js on **Private networks**.

## 3. Phone access

**At home (same Wi-Fi):** find the PC's IP (`ipconfig` → IPv4 Address, e.g. `192.168.1.42`) and open `http://192.168.1.42:3000` on the phone.

**Anywhere (recommended): Tailscale** — free, private, nothing exposed to the internet.

1. Install Tailscale on the PC and the phone, sign in to the same account on both.
2. On the phone open `http://<pc-name>:3000` (the name shown in the Tailscale app).
   - `*.ts.net` names work out of the box. For a short name like `gaming-pc`, add `ALLOWED_HOSTS="gaming-pc"` to `.env` and restart.
3. Optional: in the phone browser, *Add to Home Screen* for an app-like icon.

Do **not** port-forward 3000 or 8188 on your router — neither has a login.

## 4. Using it

Tap **VISUALISE** under any GM message → pick **Local GPU** → pick a checkpoint and frame → **GENERATE**.
The PC must be awake with ComfyUI and Edgerunn running. Set Windows power settings so it doesn't sleep while you play.
