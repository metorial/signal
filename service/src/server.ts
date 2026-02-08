void (async () => {
  await import('./init');
  await import('./instrument');
  await import('./services');
  await import('./worker');
})();
