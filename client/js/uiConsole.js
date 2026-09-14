class UIConsole {
  constructor() {
    this.modal = document.getElementById('bureau-modal');
    this.terminal = document.getElementById('bureau-terminal');
    this.progressFill = document.getElementById('bureau-progress-fill');
    this.stampArea = document.getElementById('bureau-stamp-area');
    this.caseIdEl = document.getElementById('case-file-id');
    this.statusText = document.getElementById('bureau-status-text');

    this.toast = document.getElementById('side-effect-banner');
    this.toastSummary = document.getElementById('toast-summary');
    this.toastSideEffect = document.getElementById('toast-side-effect');
    this.toastSideText = document.getElementById('toast-side-text');
    this.toastClose = document.getElementById('toast-close-btn');

    this.bindEvents();
  }

  bindEvents() {
    if (this.toastClose) {
      this.toastClose.addEventListener('click', () => {
        this.hideSideEffectToast();
      });
    }
  }

  async playBureauSequence(logLines) {
    return new Promise(resolve => {
      this.modal.classList.add('open');
      this.terminal.innerHTML = '';
      this.progressFill.style.width = '0%';
      this.stampArea.classList.remove('stamped');
      this.statusText.textContent = 'ANALYZING CHILD LOGIC...';

      const caseNumber = Math.floor(1000 + Math.random() * 9000);
      this.caseIdEl.textContent = `CASE #${caseNumber}-OK`;

      if (!Array.isArray(logLines) || logLines.length === 0) {
        logLines = [
          '[REALITY BUREAU] Child logic detected.',
          '[REALITY BUREAU] Physical possibility: questionable.',
          '[REALITY BUREAU] Temporal logic: questionable.',
          '[REALITY BUREAU] DECISION: Okay.'
        ];
      }

      let lineIdx = 0;
      const totalLines = logLines.length;

      const finish = () => {
        this.progressFill.style.width = '100%';
        this.statusText.textContent =
          'DECISION FINALIZED: REALITY COMMITTED.';

        setTimeout(() => {
          this.stampArea.classList.add('stamped');

          if (window.soundEngine?.playStamp) {
            window.soundEngine.playStamp();
          }

          setTimeout(() => {
            this.modal.classList.remove('open');
            resolve();
          }, 600);
        }, 350);
      };

      const printNextLine = () => {
        if (lineIdx >= totalLines) {
          finish();
          return;
        }

        const line = String(logLines[lineIdx] ?? '');
        const lineEl = document.createElement('div');

        if (line.includes('DECISION: Okay.')) {
          lineEl.className = 'line-highlight';
        } else if (
          line.includes('PHYSICAL POSSIBILITY') ||
          line.includes('TEMPORAL LOGIC')
        ) {
          lineEl.className = 'line-warning';
        }

        this.terminal.appendChild(lineEl);

        if (window.soundEngine?.playBureauType) {
          window.soundEngine.playBureauType();
        }

        let charIdx = 0;

        const typeChar = () => {
          if (charIdx < line.length) {
            lineEl.textContent += line[charIdx];
            charIdx++;
            setTimeout(typeChar, 12);
          } else {
            lineIdx++;

            const pct = Math.round(
              (lineIdx / totalLines) * 90
            );

            this.progressFill.style.width = `${pct}%`;
            setTimeout(printNextLine, 140);
          }
        };

        typeChar();
      };

      printNextLine();
    });
  }

  showSideEffectToast(summary, sideEffect) {
    if (!this.toast) return;

    this.toastSummary.textContent =
      summary || 'Reality alteration completed.';

    if (sideEffect) {
      this.toastSideEffect.style.display = 'block';
      this.toastSideText.textContent = sideEffect;
    } else {
      this.toastSideEffect.style.display = 'none';
    }

    this.toast.classList.add('show');

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.hideSideEffectToast();
    }, 7000);
  }

  hideSideEffectToast() {
    if (this.toast) {
      this.toast.classList.remove('show');
    }
  }
}

window.UIConsole = UIConsole;