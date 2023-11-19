/* eslint-env browser */

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

export function downloadFile(name, content) {
  const anchor = document.createElement('a');
  anchor.href = 'data:application/octet-stream,' + encodeURIComponent(content);
  anchor.download = name;
  anchor.click();
}

export function shuffle(arr, start, end) {
  if (start < 0) {
    start += arr.length;
  }
  if (!(start >= 0)) {
    start = 0;
  }
  if (end < 0) {
    end += arr.length;
  }
  if (!(end <= arr.length)) {
    end = arr.length;
  }
  for (let n = end - start, i = end - 1; n >= 2; n--, i--) {
    let j = (start + Math.random() * n) | 0;
    let t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}
