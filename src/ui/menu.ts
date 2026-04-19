export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export interface MenuOptions {
  trigger: HTMLElement;
  items: MenuItem[];
}

export function initMenu(options: MenuOptions) {
  const { trigger, items } = options;
  let isOpen = false;
  let menuContainer: HTMLDivElement | null = null;

  function close() {
    if (menuContainer) {
      document.body.removeChild(menuContainer);
      menuContainer = null;
    }
    isOpen = false;
    trigger.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick);
  }

  function handleOutsideClick(e: MouseEvent) {
    if (menuContainer && !menuContainer.contains(e.target as Node) && !trigger.contains(e.target as Node)) {
      close();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) {
      close();
      return;
    }

    isOpen = true;
    trigger.classList.add('active');

    // Create menu element
    menuContainer = document.createElement('div');
    menuContainer.className = 'desktop-menu-popover';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = `desktop-menu-item ${item.danger ? 'danger' : ''}`;
      el.textContent = item.label;
      el.onclick = () => {
        item.onClick();
        close();
      };
      menuContainer?.appendChild(el);
    });

    document.body.appendChild(menuContainer);

    // Position menu below trigger
    const rect = trigger.getBoundingClientRect();
    menuContainer.style.position = 'fixed';
    menuContainer.style.top = `${rect.bottom + 4}px`;
    menuContainer.style.left = `${rect.left}px`;
    menuContainer.style.minWidth = `${Math.max(rect.width, 140)}px`;

    document.addEventListener('click', handleOutsideClick);
  });
}
