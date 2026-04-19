import { MapMeta } from '../layers/engine/store';

export interface MapListOptions {
  container: HTMLElement;
  onSelect: (mapId: string) => void;
  onDelete: (mapId: string) => void;
  onRename: (mapId: string, newName: string) => void;
  onCreate: () => void;
}

export function initMapList(options: MapListOptions) {
  const { container, onSelect, onDelete, onRename, onCreate } = options;

  function render(maps: MapMeta[], activeId: string) {
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'map-list-header';
    header.innerHTML = `
      <span>Maps (${maps.length})</span>
      <span class="map-list-toggle">▾</span>
    `;

    const body = document.createElement('div');
    body.className = 'map-list-body';

    maps.forEach(map => {
      const item = document.createElement('div');
      item.className = `map-list-item ${map.id === activeId ? 'active' : ''}`;
      
      const name = document.createElement('span');
      name.className = 'map-list-name';
      name.textContent = map.name;

      let clickTimer: any = null;

      name.onclick = (e) => {
        e.stopPropagation();
        if (clickTimer) return; // Wait for dblclick

        clickTimer = setTimeout(() => {
          onSelect(map.id);
          clickTimer = null;
        }, 200);
      };

      // Inline renaming
      name.ondblclick = (e) => {
        e.stopPropagation();
        clearTimeout(clickTimer);
        clickTimer = null;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'map-list-item-input';
        input.value = map.name;

        const commit = () => {
          const val = input.value.trim();
          if (val && val !== map.name) {
            onRename(map.id, val);
          } else {
            // Re-render to restore name
            render(maps, activeId);
          }
        };

        input.onkeydown = (e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') render(maps, activeId);
        };
        input.onblur = commit;

        item.replaceChild(input, name);
        input.focus();
        input.select();
      };

      const deleteBtn = document.createElement('span');
      deleteBtn.className = 'map-list-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        onDelete(map.id);
      };

      item.appendChild(name);
      item.appendChild(deleteBtn);
      body.appendChild(item);
    });

    const createBtn = document.createElement('div');
    createBtn.className = 'map-list-create';
    createBtn.textContent = '+ New Map';
    createBtn.onclick = onCreate;

    body.appendChild(createBtn);
    container.appendChild(header);
    container.appendChild(body);

    // Accordion Toggle
    header.onclick = () => {
      container.classList.toggle('collapsed');
    };
  }

  return { render };
}
