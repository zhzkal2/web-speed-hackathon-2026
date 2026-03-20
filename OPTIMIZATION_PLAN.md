# Web Speed Hackathon 2026 — 최적화 계획

> 채점 기준 (Lighthouse 기반, 1150점 만점)
> **ページ表示 900점** (FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25) × 9페이지
> **ページ操作 250점** (TBT×25 + INP×25) × 5시나리오
> → 300점 이상 받아야 ページ操作 채점 시작

---

## 우선순위 요약

| 우선순위 | 항목 | 예상 점수 기여 | 난이도 | 상태 |
|---------|------|--------------|--------|------|
| 🔥 최우선 | Webpack 빌드 최적화 | TBT 직결, 전 페이지 영향 | 낮음 | ✅ 완료 |
| 🔥 최우선 | 무거운 클라이언트 라이브러리 제거/이전 | TBT 직결, 번들 사이즈 | 중간 | ✅ 완료 |
| 🔥 최우선 | HTTP 캐싱 헤더 활성화 | FCP/LCP/SI 전체 영향 | 낮음 | ✅ 완료 |
| 🔴 고우선 | FFmpeg/ImageMagick → 서버 처리로 이전 | 번들 사이즈, TBT 대폭 감소 | 높음 | ✅ 완료 |
| 🔴 고우선 | gzip 압축 | FCP, SI, LCP | 낮음 | ✅ 완료 |
| 🔴 고우선 | InfiniteScroll TBT 수정 | TBT 직결 | 낮음 | ✅ 완료 |
| 🔴 고우선 | CoveredImage 바이너리 fetch 제거 | TBT, LCP | 낮음 | ✅ 완료 |
| 🔴 고우선 | 코드 스플리팅 / lazy loading | TBT, FCP, SI | 중간 | ✅ 완료 |
| 🔴 고우선 | Tailwind CDN → 빌드타임 PostCSS | FCP, TBT | 낮음 | ✅ 완료 |
| 🔴 고우선 | jQuery/pako/미사용 패키지 제거 | TBT, 번들 사이즈 | 낮음 | ✅ 완료 |
| 🔴 고우선 | TBT 병목 제거 (setTimeout/polling) | TBT 직결 | 낮음 | ✅ 완료 |
| 🟡 중우선 | moment → 네이티브 Date API | 번들 사이즈 (~75KB) | 낮음 | ✅ 완료 |
| 🟡 중우선 | 이미지 AVIF 전환 | LCP, 전송 크기 | 중간 | ✅ 완료 |
| 🟡 중우선 | @mlc-ai/web-llm → MyMemory 번역 API | 번들 사이즈 대폭 감소 | 중간 | ✅ 완료 |
| 🟡 중우선 | Crok 스트리밍 지연 제거 | TBT (Crok 페이지) | 낮음 | ✅ 완료 |
| 🟡 중우선 | DirectMessagePage 강제 Reflow 제거 | TBT (DM 페이지) | 낮음 | ✅ 완료 |
| 🟡 중우선 | DB 쿼리 최적화 | INP, TBT (操作系) | 중간 | ⬜ 미착수 |
| 🟢 저우선 | 폰트 최적화 | CLS, FCP | 낮음 | ⬜ 미착수 |
| 🟢 저우선 | CLS 개선 | CLS 25점 | 낮음 | ⬜ 미착수 |

---

## 완료된 작업 상세

### 1. Webpack 빌드 최적화 ✅

- [x] `mode: "production"`, `devtool: false`
- [x] `optimization.minimize: true`, `usedExports`, `splitChunks`, `concatenateModules`, `sideEffects`
- [x] Babel targets `last 2 Chrome versions`, modules `false`
- [x] `inject: true` + `publicPath: "/"`
- [x] CopyWebpackPlugin에서 ffmpeg/magick WASM 제거
- [x] resolve.alias에서 불필요한 항목 제거

### 2. 무거운 클라이언트 라이브러리 제거 ✅

- [x] `@ffmpeg/ffmpeg`, `@ffmpeg/core` 제거 → 서버 ffmpeg CLI
- [x] `@imagemagick/magick-wasm` 제거 → 서버 sharp
- [x] `gifler` / `omggif` 제거 → `<video>` 태그
- [x] `@mlc-ai/web-llm` 제거 → MyMemory 번역 API (서버 프록시)
- [x] `moment` 제거 → 네이티브 Date API (`format_date.ts`)
- [x] `jquery` / `jquery-binarytransport` 제거 → 네이티브 fetch API
- [x] `pako` 제거 (서버에서 gzip 디코딩 안 함, 불필요한 클라이언트 압축)
- [x] `piexifjs` / `image-size` 제거 → 서버 sharp metadata
- [x] Dockerfile에 ffmpeg 설치 + 시드 GIF→MP4 변환 자동화
- [x] 데드 코드 파일 삭제: `convert_sound.ts`, `load_ffmpeg.ts`, `extract_metadata_from_sound.ts`

### 3. HTTP 캐싱 헤더 활성화 ✅

- [x] contenthash 파일: `Cache-Control: public, max-age=31536000, immutable`
- [x] `index.html`: `Cache-Control: no-cache`
- [x] `etag: true`, `lastModified: true`
- [x] `Connection: close` 헤더 제거

### 4. 서버 응답 압축 (gzip) ✅

- [x] `compression` 패키지 Express 미들웨어 적용

### 5. InfiniteScroll TBT 수정 ✅

- [x] `Array.from(Array(2**18))` 제거 → `IntersectionObserver` + sentinel div

### 6. CoveredImage 바이너리 fetch 제거 ✅

- [x] `fetchBinary` + Blob URL + piexifjs + image-size 전부 제거
- [x] 네이티브 `<img loading="lazy" decoding="async" object-cover>` 로 교체
- [x] 서버 image.ts에서 EXIF ImageDescription 추출 → `alt` 필드 반환

### 7. 코드 스플리팅 (React.lazy) ✅

- [x] 전 9개 컨테이너 `React.lazy()` + `<Suspense>` 적용
- [x] kuromoji/negaposi-analyzer 등 무거운 라이브러리 별도 청크 분리

### 8. TBT 병목 제거 ✅

- [x] `AspectRatioBox`: `setTimeout(500ms)` → `ResizeObserver`
- [x] `use_search_params`: `scheduler.postTask(1ms)` 폴링 → `popstate` 이벤트
- [x] `use_has_content_below`: `scheduler.postTask(1ms)` + `getBoundingClientRect()` → `IntersectionObserver`
- [x] `DirectMessagePage`: `setInterval(1ms)` + `getComputedStyle` → `ResizeObserver`

### 9. Tailwind CDN → 빌드타임 PostCSS ✅

- [x] CDN `<script>` 태그 제거 (렌더 블로킹 JS 제거)
- [x] `@tailwindcss/postcss` 플러그인으로 빌드타임 CSS 생성
- [x] `<style type="text/tailwindcss">` 내용 → `index.css` 이동
- [x] `font-display: block` → `swap` 변경 (FOIT 방지)

### 10. jQuery/패키지 정리 ✅

- [x] jQuery `$.ajax` → 네이티브 `fetch` API (에러 핸들링 포함)
- [x] webpack entry에서 `jquery-binarytransport` 제거
- [x] ProvidePlugin에서 `$`, `window.jQuery` 제거
- [x] package.json에서 미사용 의존성 전부 제거

### 11. 이미지 AVIF 전환 ✅

- [x] 시드 이미지 60개 (포스트 30 + 프로필 30) JPG → AVIF 변환
- [x] `get_path.ts`: `.jpg` → `.avif`
- [x] `image.ts`: `jpeg(q85)` → `avif(q50)`
- [x] e2e 테스트 이미지 경로 수정

### 12. Crok 최적화 ✅

- [x] `@mlc-ai/web-llm` (Gemma 2 WASM) 제거 → MyMemory 무료 번역 API
- [x] 서버 `/api/v1/translate` 프록시 엔드포인트 추가
- [x] Crok SSE 스트리밍 지연 제거: `sleep(3000)` TTFT + `sleep(10)` per char 제거

### 13. DM 페이지 최적화 ✅

- [x] `setInterval(1ms)` + `getComputedStyle` → `ResizeObserver`

---

## 미착수 작업

### DB / API 최적화

- [ ] 자주 쓰이는 쿼리에 인덱스 추가
- [ ] N+1 쿼리 확인 및 `include` (eager loading) 적용
- [ ] 타임라인 API 페이지네이션 최적화 (cursor 기반)

### 폰트 최적화

- [ ] KaTeX 폰트는 Crok 페이지 접근 시에만 로드
- [ ] 폰트 서브셋화

### CLS 개선

- [ ] 이미지/동영상 컨테이너에 `aspect-ratio` / `width`/`height` 지정
- [ ] 스켈레톤 UI

### 기타

- [ ] `lodash` → 개별 유틸 교체
- [ ] `redux-form` 경량화
- [ ] `langs` 라이브러리 제거

---

## 작업 순서

```
완료:
  ① Webpack production 빌드 설정 ✅
  ② HTTP 캐싱 활성화 ✅
  ③ FFmpeg/ImageMagick 서버 이전 + 데드 코드 제거 ✅
  ④ gzip 압축 미들웨어 ✅
  ⑤ InfiniteScroll TBT 수정 ✅
  ⑥ CoveredImage 바이너리 fetch 제거 + EXIF ALT 서버 처리 ✅
  ⑦ @mlc-ai/web-llm 제거 → MyMemory 번역 API ✅
  ⑧ Route별 코드 스플리팅 (React.lazy) ✅
  ⑨ Crok 스트리밍 지연 제거 ✅
  ⑩ DirectMessagePage 강제 Reflow 제거 ✅
  ⑪ TBT 병목 제거 (AspectRatioBox, use_search_params, use_has_content_below) ✅
  ⑫ moment → 네이티브 Date API ✅
  ⑬ Tailwind CDN → 빌드타임 PostCSS ✅
  ⑭ jQuery/pako/미사용 패키지 제거 + native fetch ✅
  ⑮ 이미지 AVIF 전환 (60파일) ✅

다음 작업:
  ⑯ DB 인덱스 추가, N+1 해소
  ⑰ lodash 제거
  ⑱ CLS 개선 (aspect-ratio)
  ⑲ 폰트 최적화
```

---

## 레귤레이션 주의사항

- `fly.toml` 변경 금지
- `GET /api/v1/crok` SSE 프로토콜 변경 금지
- SSE 이외 방법으로 Crok 응답 전달 금지
- 시드 데이터의 각종 ID 변경 금지
- VRT 통과 필수 (시각적 차이 발생 금지)
- `POST /api/v1/initialize` 로 DB 초기화 기능 유지 필수
- 수동 테스트 필수 항목: 동영상 자동재생, 동영상 품질, 음성 메타데이터 Shift_JIS 정상표시, TIFF 이미지 업로드, EXIF ALT 표시
