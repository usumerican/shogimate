export function parseHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
    .join('');
  return template.content.firstChild;
}

export function on(target, types, listener) {
  for (const type of types.split(' ')) {
    target.addEventListener(type, (ev) => {
      if (ev.cancelable) {
        ev.preventDefault();
      }
      ev.stopPropagation();
      listener(ev);
    });
  }
}

export function onLongPress(target, listener, startTime = 500, repeatTime = 100) {
  let timeoutId;
  let count;

  function doStart() {
    if (!target.disabled) {
      doEnd();
      doRepeat(startTime);
    }
  }

  function doRepeat(time) {
    if (listener(count++) || target.disabled) {
      doEnd();
    } else {
      timeoutId = setTimeout(() => {
        if (timeoutId) {
          doRepeat(repeatTime);
        }
      }, time);
    }
  }

  function doEnd() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = 0;
    count = 0;
  }

  on(target, 'mousedown touchstart', doStart);
  on(target, 'mouseup mouseleave touchend touchcancel', doEnd);
  on(target, 'contextmenu', () => {});
}

export function setTextareaValue(target, text) {
  target.value = text;
  target.scrollTop = 0;
}

export function setSelectValue(target, value, defaultValue) {
  const v = value ?? defaultValue ?? null;
  if (v !== null) {
    const s = String(v);
    for (const option of target.options) {
      if (option.value === s) {
        option.selected = true;
        return;
      }
    }
  }
}

export function openUrl(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noreferrer';
  a.click();
}

export function downloadTextFile(name, content) {
  const anchor = document.createElement('a');
  anchor.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  anchor.download = name;
  anchor.click();
}
