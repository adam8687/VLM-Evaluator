export function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.remove('active');
    p.style.animation = 'none';
    p.offsetHeight;
    p.style.animation = null;
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('tab-' + name);
  target.classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add('active');
}
