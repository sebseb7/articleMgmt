import { Component } from 'react';

const SCROLL_KEYS = new Set([
  ' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown',
]);

function isModalOpen() {
  return Boolean(document.querySelector('.MuiModal-root'));
}

function isScrollable(node) {
  if (!(node instanceof Element)) return false;
  const { overflowY } = getComputedStyle(node);
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return node.scrollHeight > node.clientHeight;
}

function allowWheelInScrollable(e, modal) {
  let node = e.target;
  while (node && node !== modal) {
    if (isScrollable(node)) {
      const delta = e.deltaY;
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault();
      }
      return;
    }
    node = node.parentElement;
  }
  e.preventDefault();
}

function onWheel(e) {
  if (!isModalOpen()) return;

  const modal = e.target.closest?.('.MuiModal-root');
  if (!modal) {
    e.preventDefault();
    return;
  }

  allowWheelInScrollable(e, modal);
}

function onTouchMove(e) {
  if (!isModalOpen()) return;

  const modal = e.target.closest?.('.MuiModal-root');
  if (!modal) {
    e.preventDefault();
    return;
  }

  let node = e.target;
  while (node && node !== modal) {
    if (isScrollable(node)) return;
    node = node.parentElement;
  }
  e.preventDefault();
}

function onKeyDown(e) {
  if (!isModalOpen() || !SCROLL_KEYS.has(e.key)) return;
  if (!e.target.closest?.('.MuiModal-root')) {
    e.preventDefault();
  }
}

/** Block page scroll while a MUI modal is open without hiding the scrollbar. */
export default class ModalScrollLock extends Component {
  componentDidMount() {
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('keydown', onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('wheel', onWheel);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('keydown', onKeyDown);
  }

  render() {
    return null;
  }
}
