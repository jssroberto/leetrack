import { ConfidenceLevel } from '@extension/types/leetcode';

export class ConfidenceModal {
  private static readonly CONTAINER_ID = 'leetrack-confidence-modal';

  static async show(): Promise<ConfidenceLevel | null> {
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
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal {
          background: #1a1a1a;
          color: #fff;
          padding: 24px;
          border-radius: 12px;
          width: 320px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          border: 1px solid #333;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        h2 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }
        p {
          margin: 0 0 20px 0;
          color: #a0a0a0;
          font-size: 14px;
        }
        .options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        button {
          background: #2a2a2a;
          border: 1px solid #333;
          color: #e0e0e0;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        button:hover {
          background: #333;
          border-color: #444;
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        .emoji {
          font-size: 18px;
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
