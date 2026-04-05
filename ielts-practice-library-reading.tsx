import React from 'react';
import Link from 'next/link';

export default function IeltsReadingPractice() {
  return (
    <div className="ipl-content">
      {/* ── Suggestions Carousel ──────────────────────────────────── */}
      <section className="ipl-suggestions" id="ipl-suggestions">
        <h2 className="ipl-suggestions__title">Suggestions for you</h2>
        <div className="ipl-suggestions__carousel-wrapper">
          <div className="ipl-suggestions__carousel" id="suggestionsCarousel">
            {/* Card 1 */}
            <div className="ipl-test-card">
              <div className="ipl-test-card__inner">
                <div className="ipl-test-card__image-wrap">
                  <img src="/assets/fun-run.png" alt="Bridge to Brisbane Fun Run" className="ipl-test-card__image" />
                  <span className="ipl-test-card__badge-part">Part 1</span>
                  <span className="ipl-test-card__badge-pro">PRO</span>
                </div>
                <div className="ipl-test-card__info">
                  <h4 className="ipl-test-card__title"><Link href="#">[COM] Bridge to Brisbane Fun Run</Link></h4>
                  <span className="ipl-test-card__attempts">1195 attempts</span>
                </div>
                <div className="ipl-test-card__actions">
                  <Link href="#" className="ipl-test-card__btn">
                    <svg className="ipl-test-card__btn-icon" viewBox="0 0 25 25" fill="none">
                      <circle cx="12.5" cy="12.5" r="12.5" fill="#D94A56" />
                      <polygon points="10,7 18,12.5 10,18" fill="#FFFFFF" />
                    </svg>
                    <span className="ipl-test-card__btn-text">Kiểm Tra</span>
                  </Link>
                  <span className="ipl-test-card__score">9,0</span>
                </div>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="ipl-test-card">
              <div className="ipl-test-card__inner">
                <div className="ipl-test-card__image-wrap">
                  <img src="/assets/fun-run.png" alt="Bridge to Brisbane Fun Run" className="ipl-test-card__image" />
                  <span className="ipl-test-card__badge-part">Part 1</span>
                  <span className="ipl-test-card__badge-pro">PRO</span>
                </div>
                <div className="ipl-test-card__info">
                  <h4 className="ipl-test-card__title"><Link href="#">[COM] Bridge to Brisbane Fun Run</Link></h4>
                  <span className="ipl-test-card__attempts">1195 attempts</span>
                </div>
                <div className="ipl-test-card__actions">
                  <Link href="#" className="ipl-test-card__btn">
                    <svg className="ipl-test-card__btn-icon" viewBox="0 0 25 25" fill="none">
                      <circle cx="12.5" cy="12.5" r="12.5" fill="#D94A56" />
                      <polygon points="10,7 18,12.5 10,18" fill="#FFFFFF" />
                    </svg>
                    <span className="ipl-test-card__btn-text">Kiểm Tra</span>
                  </Link>
                  <span className="ipl-test-card__score">9,0</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="ipl-test-card">
              <div className="ipl-test-card__inner">
                <div className="ipl-test-card__image-wrap">
                  <img src="/assets/fun-run.png" alt="Bridge to Brisbane Fun Run" className="ipl-test-card__image" />
                  <span className="ipl-test-card__badge-part">Part 1</span>
                  <span className="ipl-test-card__badge-pro">PRO</span>
                </div>
                <div className="ipl-test-card__info">
                  <h4 className="ipl-test-card__title"><Link href="#">[COM] Bridge to Brisbane Fun Run</Link></h4>
                  <span className="ipl-test-card__attempts">1195 attempts</span>
                </div>
                <div className="ipl-test-card__actions">
                  <Link href="#" className="ipl-test-card__btn">
                    <svg className="ipl-test-card__btn-icon" viewBox="0 0 25 25" fill="none">
                      <circle cx="12.5" cy="12.5" r="12.5" fill="#D94A56" />
                      <polygon points="10,7 18,12.5 10,18" fill="#FFFFFF" />
                    </svg>
                    <span className="ipl-test-card__btn-text">Kiểm Tra</span>
                  </Link>
                  <span className="ipl-test-card__score">9,0</span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="ipl-test-card">
              <div className="ipl-test-card__inner">
                <div className="ipl-test-card__image-wrap">
                  <img src="/assets/fun-run.png" alt="Bridge to Brisbane Fun Run" className="ipl-test-card__image" />
                  <span className="ipl-test-card__badge-part">Part 1</span>
                  <span className="ipl-test-card__badge-pro">PRO</span>
                </div>
                <div className="ipl-test-card__info">
                  <h4 className="ipl-test-card__title"><Link href="#">[COM] Bridge to Brisbane Fun Run</Link></h4>
                  <span className="ipl-test-card__attempts">1195 attempts</span>
                </div>
                <div className="ipl-test-card__actions">
                  <Link href="#" className="ipl-test-card__btn">
                    <svg className="ipl-test-card__btn-icon" viewBox="0 0 25 25" fill="none">
                      <circle cx="12.5" cy="12.5" r="12.5" fill="#D94A56" />
                      <polygon points="10,7 18,12.5 10,18" fill="#FFFFFF" />
                    </svg>
                    <span className="ipl-test-card__btn-text">Kiểm Tra</span>
                  </Link>
                  <span className="ipl-test-card__score">9,0</span>
                </div>
              </div>
            </div>
          </div>
          <div className="ipl-suggestions__nav">
            <button className="ipl-suggestions__nav-btn ipl-suggestions__nav-btn--prev" id="suggestPrev" aria-label="Previous">
              <svg viewBox="0 0 12 12">
                <path d="M4.5 1L9.5 6L4.5 11" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="ipl-suggestions__nav-btn ipl-suggestions__nav-btn--next" id="suggestNext" aria-label="Next">
              <svg viewBox="0 0 12 12">
                <path d="M4.5 1L9.5 6L4.5 11" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <hr className="ipl-separator" />

      {/* ── Reading Practice Section ──────────────────────────────── */}
      <section className="ipl-practice" id="ipl-practice">
        <div className="ipl-practice__header">
          <h2 className="ipl-practice__title">IELTS Reading Practice</h2>
          <div className="ipl-skill-tabs" id="ipl-skill-tabs">
            <Link href="/ielts-practice-library" className="ipl-skill-tab">
              <svg className="ipl-skill-tab__icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 2h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v12h12V4H4zm2 2h8v2H6V6zm0 4h8v2H6v-2z" />
              </svg>
              <span>Mock Tests</span>
            </Link>
            <Link href="/ielts-practice-library/listening" className="ipl-skill-tab">
              <svg className="ipl-skill-tab__icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v4a4 4 0 004 4h1v-5H6V8a4 4 0 018 0v3h-3v5h1a4 4 0 004-4V8a6 6 0 00-6-6z" />
              </svg>
              <span>Listening Practices</span>
            </Link>
            <Link href="/ielts-practice-library/reading" className="ipl-skill-tab ipl-skill-tab--active">
              <svg className="ipl-skill-tab__icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 4a2 2 0 012-2h4.586A2 2 0 0110 2.586L13.414 6A2 2 0 0114 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h8V8h-3a1 1 0 01-1-1V4H4zm7 0l3 3h-3V4z" />
              </svg>
              <span>Reading Practices</span>
            </Link>
            <Link href="#" className="ipl-skill-tab">
              <svg className="ipl-skill-tab__icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a3 3 0 00-3 3v4a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a5 5 0 0010 0h2a7 7 0 01-6 6.93V18h-2v-3.07A7 7 0 013 8h2z" />
              </svg>
              <span>Speaking Samples</span>
            </Link>
            <Link href="#" className="ipl-skill-tab">
              <svg className="ipl-skill-tab__icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 3h10v2H5V5zm0 4h10v2H5V9zm0 4h7v2H5v-2z" />
              </svg>
              <span>Writing Samples</span>
            </Link>
          </div>
        </div>

        <div className="ipl-practice__body">
          {/* Filter Sidebar */}
          <aside className="ipl-filter-sidebar" id="ipl-filter-sidebar">
            <div className="ipl-filter-card">
              <h3 className="ipl-filter-card__title">Search</h3>
              <div className="ipl-filter-search">
                <input type="text" className="ipl-filter-search__input" placeholder="Search" id="filterSearch" />
                <button className="ipl-filter-search__btn" aria-label="Search">
                  <svg viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="ipl-filter-card">
              <h3 className="ipl-filter-card__title">Nguồn tài liệu</h3>
              <div className="ipl-filter-checkbox-group">
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="source" value="premium" /> Premium
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="source" value="free" /> Free
                </label>
              </div>
            </div>

            {/* Reading Passage Filter */}
            <div className="ipl-filter-card">
              <h3 className="ipl-filter-card__title">Phần</h3>
              <div className="ipl-filter-checkbox-group">
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="part" value="1" /> Passage 1
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="part" value="2" /> Passage 2
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="part" value="3" /> Passage 3
                </label>
              </div>
            </div>

            {/* Question Form Filter */}
            <div className="ipl-filter-card">
              <h3 className="ipl-filter-card__title">Loại câu hỏi</h3>
              <div className="ipl-filter-checkbox-group">
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="gap-filling" /> Gap Filling
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="map" /> Map
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="diagram-label" /> Diagram Label
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="matching-features" /> Matching Features
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="matching-information" /> Matching Information
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="mcq-many" /> Multiple Choice (Many Answers)
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="mcq-single" /> Multiple Choice (Single Answer)
                </label>
                <label className="ipl-filter-checkbox">
                  <input type="checkbox" name="qform" value="other" /> Other Types
                </label>
              </div>
            </div>
          </aside>

          {/* Card Grid */}
          <div className="ipl-card-grid" id="ipl-card-grid">
            {/* Generating 9 sample cards for the library grid */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item, index) => (
              <div className="ipl-test-card" key={index}>
                <div className="ipl-test-card__inner">
                  <div className="ipl-test-card__image-wrap">
                    <img src="/assets/fun-run.png" alt="Bridge to Brisbane Fun Run" className="ipl-test-card__image" />
                    <span className="ipl-test-card__badge-part">Part {Math.ceil(item / 3)}</span>
                    {item <= 6 && <span className="ipl-test-card__badge-pro">PRO</span>}
                  </div>
                  <div className="ipl-test-card__info">
                    <h4 className="ipl-test-card__title"><Link href="#">[COM] Bridge to Brisbane Fun Run</Link></h4>
                    <span className="ipl-test-card__attempts">1195 attempts</span>
                  </div>
                  <div className="ipl-test-card__actions">
                    <Link href="#" className="ipl-test-card__btn">
                      <svg className="ipl-test-card__btn-icon" viewBox="0 0 25 25" fill="none">
                        <circle cx="12.5" cy="12.5" r="12.5" fill="#D94A56" />
                        <polygon points="10,7 18,12.5 10,18" fill="#FFFFFF" />
                      </svg>
                      <span className="ipl-test-card__btn-text">Kiểm Tra</span>
                    </Link>
                    <span className="ipl-test-card__score">9,0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pagination */}
      <nav className="ipl-pagination" id="ipl-pagination" aria-label="Pagination">
        <ul className="ipl-pagination__list">
          <li>
            <button className="ipl-pagination__item ipl-pagination__item--disabled" aria-label="Previous page">
              <svg className="ipl-pagination__arrow ipl-pagination__arrow--left" viewBox="0 0 12 12">
                <path d="M4.5 1L9.5 6L4.5 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          </li>
          <li><Link href="#" className="ipl-pagination__item ipl-pagination__item--active">1</Link></li>
          <li><Link href="#" className="ipl-pagination__item">2</Link></li>
          <li><Link href="#" className="ipl-pagination__item">3</Link></li>
          <li><Link href="#" className="ipl-pagination__item">4</Link></li>
          <li><Link href="#" className="ipl-pagination__item">5</Link></li>
          <li><span className="ipl-pagination__dots">•••</span></li>
          <li><Link href="#" className="ipl-pagination__item">10</Link></li>
          <li>
            <button className="ipl-pagination__item" aria-label="Next page">
              <svg className="ipl-pagination__arrow" viewBox="0 0 12 12">
                <path d="M4.5 1L9.5 6L4.5 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
