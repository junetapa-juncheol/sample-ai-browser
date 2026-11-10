# 느린빛 사진관

가상 사진관에서 사물 사진을 골라 분류 결과를 살펴보는 정적 웹 체험입니다.
TensorFlow.js와 공개 MobileNet 모델이 브라우저 안에서 분류합니다.
Go의 흑백 변환과 Rust의 밝기 측정도 같은 기기 안에서 실행합니다.

## 쓴 기술

| 기술 | 사용한 곳 | 화면 |
| --- | --- | --- |
| TensorFlow.js 4.22.0 | [src/main.js](src/main.js) · CPU 추론, 텐서 해제 | 사물 후보 3개·확률·실행 시간 |
| MobileNet v1 0.25 / 224 | [public/model/model.json](public/model/model.json), 같은 폴더의 가중치 | 분류 모델 준비 상태 |
| Go → WebAssembly | [go/main.go](go/main.go), [public/wasm/photo.wasm](public/wasm/photo.wasm) | 흑백으로 보기·원본으로 보기 |
| Rust → WebAssembly | [rust/lib.rs](rust/lib.rs), [public/wasm/light.wasm](public/wasm/light.wasm) | 사진 밝기 백분율 |
| 파일·Canvas API | [src/image.js](src/image.js), [src/main.js](src/main.js) | 파일 선택·드롭·미리보기·비우기 |
| Vite | [vite.config.js](vite.config.js) | `/sample-ai-browser/` 하위 경로 |

## 실행 방법

Node.js 24 이상에서 실행합니다. Go·Rust 설치 없이도 포함된 모듈로 실행·시험·빌드할 수 있습니다.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

실행기가 출력하는 주소 뒤에 `/sample-ai-browser/`를 붙입니다.
GitHub 웹에서 이 폴더의 내용을 저장소 루트에 올리고 Settings → Pages → Deploy from a branch → main /docs를 선택합니다.
`docs/`의 완성된 정적 파일을 그대로 게시하며, 파일 탐색기에서 여는 대신 HTTP 서버를 사용합니다.

## 보는 주소

https://junetapa-juncheol.github.io/sample-ai-browser/

이 주소는 GitHub Pages를 설정한 뒤 열립니다.

## 사진 처리

- JPG·PNG·WebP, 15MB 이하, 4천만 화소 이하를 지원합니다. 긴 변 640픽셀로 줄여 기기 메모리에만 보관합니다.
- 사진·파일명·분류 결과를 서버나 저장 공간으로 보내거나 저장하지 않습니다. 외부로 연결할 수 없도록 `index.html`의 콘텐츠 보안 정책에서 연결 대상을 같은 출처로 제한합니다.
- 사진 URL은 읽은 뒤 해제합니다. 비우기를 누르면 원본 픽셀과 미리보기를 해제합니다. 새로고침하면 사진이 없어집니다. 브라우저의 메모리 회수 시점은 브라우저가 관리합니다.
- 분류 결과는 MobileNet의 영문 사물 분류 추정치입니다. 사물·풍경 체험용이며 사진의 실제 내용과 다를 수 있습니다.
- 모델과 가중치를 포함했으므로 실행 시 외부 모델 CDN 연결이 필요하지 않습니다. 분류 도구를 읽지 못하면 재시도 안내를 표시합니다.
- Go는 RGBA에서 가중 평균으로 흑백 픽셀을 만듭니다. Rust는 같은 가중치의 밝기를 계산합니다. 원본으로 돌아갈 수 있습니다.

## 모듈을 다시 빌드하기

확인한 도구는 Go 1.27.3, Rust 1.99.1입니다. 아래 명령은 저장소 루트에서 실행하는 셸 예입니다.

```sh
cd go
GOOS=js GOARCH=wasm go build -trimpath -ldflags='-s -w' -o ../public/wasm/photo.wasm .
cd ..
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" public/wasm/wasm_exec.js
rustup target add wasm32-unknown-unknown
rustc --target wasm32-unknown-unknown --crate-type cdylib -C opt-level=z -C panic=abort -C strip=symbols rust/lib.rs -o public/wasm/light.wasm
npm run build
```

Go의 실행 보조 파일은 빌드에 사용한 Go 버전과 맞춰야 합니다. Windows PowerShell에서는 Go 빌드 전에 `$env:GOOS='js'; $env:GOARCH='wasm'`을 설정합니다.

## 모델 출처와 라이선스

MobileNet 모델은 [TensorFlow 공개 모델 저장소](https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json)의 고정 자산을 포함했습니다. 분류 이름은 `@tensorflow-models/mobilenet` 2.1.1의 ImageNet 목록을 사용합니다.
TensorFlow.js·MobileNet은 Apache 2.0, Go 실행 보조 파일은 BSD 조건을 따릅니다. 각 원문은 [public/model/license.txt](public/model/license.txt), [public/wasm/go-license.txt](public/wasm/go-license.txt), [public/third-party.txt](public/third-party.txt)에 포함되어 있습니다.
직접 작성한 코드는 [MIT License](LICENSE), 저작권자는 junetapa입니다.
