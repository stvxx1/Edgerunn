# Local model for the helper jobs (saves Gemini's free quota)

Edgerunn makes small side requests besides the GM's replies: writing the image prompt from a scene
(VISUALISE) and keeping the story summary. They share Gemini's **free quota**, which is small, and
when it runs out you get "Gemini's free daily limit is used up" and a plain summary instead of a
written image prompt.

A small model running on your own machine fixes that. No account, no key, no daily limit, and
nothing leaves your computer. It is **only for these helper jobs**; the GM stays on Gemini.

## Set it up (about 5 minutes)

1. Install **Ollama** from <https://ollama.com/download> (the Mac app), or `brew install ollama`.
2. In Terminal, download a small model (about 2 GB):
   ```
   ollama pull llama3.2:3b
   ```
3. Make sure Ollama is running (its icon is in the menu bar).
4. Restart Edgerunn. That's it: it detects Ollama by itself.

LM Studio works the same way if you start its local server (port 1234).

## When it is used

| Setting in `.env` | What happens |
|---|---|
| nothing (default) | Gemini first. If every Gemini model is out of quota or down, the local model answers. |
| `HELPER_PREFER="local"` | The local model goes first, so Gemini's quota is saved for the GM's replies. |

Image prompts from a 3B model are decent but a step below Gemini's. If you like Gemini's better,
leave the default and use the local model only as the safety net.

## On an 8 GB Mac

- `llama3.2:3b` (about 2 GB in memory) is the right size. Don't use 7B models on 8 GB.
- ComfyUI image generation and the local model both want memory. Run them one at a time. Ollama frees
  the model by itself after 10 minutes idle, or immediately with `ollama stop llama3.2:3b`.

## A model on another computer

Run Ollama on the PC with `OLLAMA_HOST=0.0.0.0`, keep both machines on your home network or
Tailscale (Ollama has no login), then on the Mac set in `.env`:
```
LOCAL_LLM_URL="http://<pc-name-or-ip>:11434"
```

## Gemini's free quota, in short

- It is per Google project and per model, so a backup key only helps if it's from a **different project**.
- The daily limit resets at midnight Pacific time, which is roughly **5-7 pm in Sydney or Melbourne**
  depending on daylight saving. Edgerunn shows the exact time on your clock when it hits the limit.
