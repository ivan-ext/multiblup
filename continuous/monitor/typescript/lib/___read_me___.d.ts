// To add an untyped JS library to TS:
//
// 1) Name a file <lib-name>.d.ts
// 2) Its only content must be:
//		declare module "*";
// 3) Place it in *this* directory
// 4) Add import into your TS files:
//		import * as q from '<lib-name>';
