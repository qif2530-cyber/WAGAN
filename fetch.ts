async function main() {
    const r = await fetch("https://open.klingai.com/api-doc");
    const t = await r.text();
    console.log(t.substring(0, 500));
}
main();
