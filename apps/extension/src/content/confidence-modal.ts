import { ConfidenceLevel } from '@extension/types/leetcode';

export class ConfidenceModal {
  private static readonly CONTAINER_ID = 'leetrack-confidence-modal';
  private static readonly FONTS_ID = 'leetrack-fonts';

  private static injectFonts(): void {
    if (document.getElementById(this.FONTS_ID)) return;

    const style = document.createElement('style');
    style.id = this.FONTS_ID;
    style.textContent = `
      @font-face {
        font-family: 'RobotoSlabRegular';
        src: url('${chrome.runtime.getURL('assets/fonts/RobotoSlab-Regular.woff2')}') format('woff2');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'RobotoSlabBold';
        src: url('${chrome.runtime.getURL('assets/fonts/RobotoSlab-Bold.woff2')}') format('woff2');
        font-weight: bold;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  }

  static async show(): Promise<ConfidenceLevel | null> {
    this.injectFonts();

    return new Promise((resolve) => {
      // Remove existing modal if any
      const existing = document.getElementById(this.CONTAINER_ID);
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.id = this.CONTAINER_ID;
      const shadow = container.attachShadow({ mode: 'open' });

      // Styles
      const style = document.createElement('style');
      style.textContent = `
        :host {
          --color-bg: #1F1F1F;
          --color-surface: #2F2F2F;
          --color-border: #3B3B3B;
          --color-text: #ffffff;
          --color-primary: #E97436;
          --color-primary-hover: #A24E21;
          --color-muted: #979797;
          --shadow: rgba(0, 0, 0, 0.2);
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal {
          background: var(--color-surface);
          color: var(--color-text);
          padding: 24px;
          border-radius: 12px;
          width: 340px;
          box-shadow: 0 8px 32px var(--shadow);
          text-align: center;
          font-family: 'RobotoSlabRegular', serif;
          border: 1px solid var(--color-border);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        h2 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: bold;
          font-family: 'RobotoSlabBold', serif;
          color: var(--color-text);
        }
        p {
          margin: 0 0 24px 0;
          color: var(--color-muted);
          font-size: 14px;
        }
        .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        button {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 12px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-family: 'RobotoSlabRegular', serif;
          transition: all 0.2s;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        button:hover {
          background: #383838;
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        .emoji {
          font-size: 20px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;

      // Content
      const overlay = document.createElement('div');
      overlay.className = 'overlay';

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          container.remove();
          resolve(null);
        }
      });

      const modal = document.createElement('div');
      modal.className = 'modal';

      const title = document.createElement('h2');
      title.textContent = 'Great Job! 🎉';

      const subtitle = document.createElement('p');
      subtitle.textContent = 'How did this problem feel?';

      const options = document.createElement('div');
      options.className = 'options';

      const levels: { value: ConfidenceLevel; label: string; emoji: string }[] = [
        { value: 'EASY', label: 'Easy / Knew it immediately', emoji: '⚡' },
        { value: 'SOLVED_ALONE', label: 'Solved alone (took some time)', emoji: '🧠' },
        { value: 'NEEDED_HINTS', label: 'Needed hints / Checked solution', emoji: '💡' },
        { value: 'STRUGGLED', label: 'Struggled / Need to revisit', emoji: '🥵' },
      ];

      levels.forEach((level) => {
        const btn = document.createElement('button');
        btn.innerHTML = `<span class="emoji">${level.emoji}</span> ${level.label}`;
        btn.onclick = () => {
          container.remove();
          resolve(level.value);
        };
        options.appendChild(btn);
      });

      modal.appendChild(title);
      modal.appendChild(subtitle);
      modal.appendChild(options);
      overlay.appendChild(modal);

      shadow.appendChild(style);
      shadow.appendChild(overlay);

      document.body.appendChild(container);

      // Focus first button for accessibility
      const firstBtn = options.querySelector('button');
      if (firstBtn) (firstBtn as HTMLElement).focus();
    });
  }
}
