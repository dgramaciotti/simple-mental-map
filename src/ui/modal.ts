export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function showModal(options: ModalOptions) {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container';

  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${message}</div>
    <div class="modal-footer">
      <button class="modal-btn cancel">${cancelText}</button>
      <button class="modal-btn confirm ${danger ? 'danger' : 'primary'}">${confirmText}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const cleanup = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(modal);
  };

  modal.querySelector('.cancel')?.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });

  modal.querySelector('.confirm')?.addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  // Close on overlay click
  overlay.onclick = cleanup;
}

export interface PromptModalOptions extends Omit<ModalOptions, 'onConfirm'> {
  defaultValue?: string;
  onConfirm: (value: string) => void;
}

export function showPromptModal(options: PromptModalOptions) {
  const { title, message, defaultValue = '', confirmText = 'Create', cancelText = 'Cancel', onConfirm, onCancel } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container';

  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${message}</div>
    <input type="text" class="modal-input" value="${defaultValue}" />
    <div class="modal-footer">
      <button class="modal-btn cancel">${cancelText}</button>
      <button class="modal-btn confirm primary">${confirmText}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const input = modal.querySelector('.modal-input') as HTMLInputElement;
  input.focus();
  input.select();

  const cleanup = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(modal);
  };

  const commit = () => {
    const val = input.value.trim();
    if (val) {
      cleanup();
      onConfirm(val);
    }
  };

  modal.querySelector('.cancel')?.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });

  modal.querySelector('.confirm')?.addEventListener('click', commit);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cleanup();
  });

  overlay.onclick = cleanup;
}

export function showLargePromptModal(options: PromptModalOptions) {
  const { title, message, defaultValue = '', confirmText = 'Import', cancelText = 'Cancel', onConfirm, onCancel } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container large';

  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${message}</div>
    <textarea class="modal-input modal-textarea" spellcheck="false" placeholder="Paste markdown here...">${defaultValue}</textarea>
    <div class="modal-footer">
      <button class="modal-btn cancel">${cancelText}</button>
      <button class="modal-btn confirm primary">${confirmText}</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const textarea = modal.querySelector('.modal-textarea') as HTMLTextAreaElement;
  textarea.focus();
  textarea.select();

  const cleanup = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(modal);
  };

  const commit = () => {
    const val = textarea.value.trim();
    if (val) {
      cleanup();
      onConfirm(val);
    }
  };

  modal.querySelector('.cancel')?.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });

  modal.querySelector('.confirm')?.addEventListener('click', commit);
  
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit();
    if (e.key === 'Escape') cleanup();
  });

  overlay.onclick = cleanup;
}

export interface SelectionOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface SelectionModalOptions {
  title: string;
  message: string;
  options: SelectionOption[];
  onSelect: (id: string) => void;
  onCancel?: () => void;
}

export function showSelectionModal(options: SelectionModalOptions) {
  const { title, message, options: selectionOptions, onSelect, onCancel } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container selection-modal';

  modal.innerHTML = `
    <div class="modal-header">${title}</div>
    <div class="modal-body">${message}</div>
    <div class="selection-list">
      ${selectionOptions.map(opt => `
        <button class="selection-item" data-id="${opt.id}">
          <span class="selection-label">${opt.label}</span>
          ${opt.description ? `<span class="selection-desc">${opt.description}</span>` : ''}
        </button>
      `).join('')}
    </div>
    <div class="modal-footer">
      <button class="modal-btn cancel">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const cleanup = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(modal);
  };

  modal.querySelectorAll('.selection-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')!;
      cleanup();
      onSelect(id);
    });
  });

  modal.querySelector('.cancel')?.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });

  overlay.onclick = cleanup;
}
