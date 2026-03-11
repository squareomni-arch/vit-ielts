# Task 33 — Automated Testing: Quiz CRUD + Test Flow + Scoring Engine

## Mô tả
Xây dựng bộ test tự động (Vitest) cho 3 service core, đảm bảo coverage đầy đủ 6 loại câu hỏi.

## Prerequisites
- Task 03 (Scoring Engine) hoàn thành
- Task 04 (Quiz Service) hoàn thành
- Task 06 (Test Flow) hoàn thành

## Files đã tạo

### Infrastructure
- `vitest.config.ts` — Config Vitest + path aliases
- `tests/fixtures/quiz-data.ts` — Quiz data mẫu cho 6 loại câu hỏi
- `tests/fixtures/supabase-mock.ts` — Mock Supabase client factory

### Test Suites
- `tests/scoring.test.ts` — 41 tests: Radio, Select, Fillup, Checkbox, Matching (3 layouts), Matrix, Band Score, Edge Cases
- `tests/quiz-service.test.ts` — 12 tests: getQuizBySlug, getQuizzes, createQuiz, updateQuiz, deleteQuiz
- `tests/test-flow.test.ts` — 12 tests: takeTheTest (create/resume/retake/auth/pro), saveTestResult, submitTestResult
- `tests/integration-scoring.test.ts` — 4 tests: full quiz scoring end-to-end

### Files sửa
- `package.json` — Thêm `vitest`, `vite-tsconfig-paths`, scripts `test`/`test:watch`

## Lệnh chạy
```bash
npm test              # Chạy tất cả tests
npm run test:watch    # Watch mode
npx vitest run tests/scoring.test.ts  # Chạy 1 file
```

## Acceptance Criteria
- [x] Vitest cài đặt và cấu hình đúng
- [x] Test fixtures cho đủ 6 loại câu hỏi
- [x] Scoring Engine: radio, select, fillup, checkbox, matching (3 layouts), matrix
- [x] Scoring Engine: band score rounding 0.5, edge cases (null/empty)
- [x] Quiz Service: CRUD operations + filter + pagination
- [x] Test Flow: start/resume/retake/auth/pro-access/save/submit
- [x] Integration: end-to-end scoring với quiz phức tạp (40 questions)
- [x] Tất cả 69 tests pass
- [x] Build production không bị ảnh hưởng
