async function main() {
  await import('./init');
  await import('./instrument');
  await import('./endpoints');
  await import('./worker');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
