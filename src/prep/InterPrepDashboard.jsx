import { useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import "./InterPrep.css";

const COLLECTIONS = [
  { id: "Original 462 Platform", label: "Original bank", icon: "book", tone: "green" },
  { id: "Imported Sessions", label: "Imported sessions", icon: "code", tone: "sand" },
  { id: "Combined Mixed Mocks", label: "Mixed mocks", icon: "layers", tone: "blue" },
];

const PAGE_SIZE = 24;
const formatNumber = (number) => number.toLocaleString("en-US");

function displayTitle(title) {
  return title
    .replace(/^SESSION\s+/i, "Session ")
    .replace(/—\s*(.+)/, (_, text) => `— ${text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}`)
    .replace(/\bJavascript\b/g, "JavaScript")
    .replace(/\bDevops\b/g, "DevOps")
    .replace(/\bPsrs\b/g, "PSRS");
}

export default function InterPrepDashboard({ questionBank, exams, byId, ExamRunner }) {
  const [view, setView] = useState("overview");
  const [activeExamId, setActiveExamId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(COLLECTIONS[0].id);
  const [examSearch, setExamSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [libraryPage, setLibraryPage] = useState(1);
  const mainRef = useRef(null);

  const scoredCount = useMemo(() => questionBank.filter((q) => q.a !== null && q.a !== undefined).length, [questionBank]);
  const topics = useMemo(() => Array.from(new Set(questionBank.map((q) => q.topic || "General"))).sort(), [questionBank]);
  const activeExam = exams.find((exam) => exam.id === activeExamId);
  const activeCollection = COLLECTIONS.find((collection) => collection.id === activeGroup);
  const collectionExams = exams.filter((exam) => exam.group === activeGroup);
  const filteredExams = collectionExams.filter((exam) => `${exam.title} ${exam.subtitle}`.toLowerCase().includes(examSearch.trim().toLowerCase()));
  const visibleExams = view === "overview" ? collectionExams.slice(0, 6) : filteredExams;

  const filteredQuestions = useMemo(() => {
    const term = librarySearch.trim().toLowerCase();
    return questionBank.filter((question) => {
      const matchesTopic = topicFilter === "All" || (question.topic || "General") === topicFilter;
      const matchesSearch = !term || [question.q, ...question.o, question.source || "", question.topic || ""].some((text) => text.toLowerCase().includes(term));
      return matchesTopic && matchesSearch;
    });
  }, [questionBank, librarySearch, topicFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const page = Math.min(libraryPage, totalPages);
  const pageQuestions = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function focusMain() {
    window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function navigate(nextView) {
    setActiveExamId(null);
    setView(nextView);
    focusMain();
  }

  function startExam(id) {
    setActiveExamId(id);
    focusMain();
  }

  const pageTitle = activeExam ? "Practice session" : view === "library" ? "Question library" : view === "practice" ? "Practice exams" : "Overview";
  const navigationView = activeExam ? "practice" : view;

  return (
    <div className="prep-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar" aria-label="Study navigation">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate("overview"); }} aria-label="InterPrep home">
          <span className="brand-mark"><Icon name="book" /></span>
          <span className="brand-name">Inter<span>Prep</span></span>
        </a>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {[
            { id: "overview", icon: "grid", label: "Overview" },
            { id: "practice", icon: "exam", label: "Practice exams" },
            { id: "library", icon: "book", label: "Question library" },
          ].map((item) => (
            <button key={item.id} className={`sidebar-link ${navigationView === item.id ? "is-active" : ""}`} aria-current={navigationView === item.id ? "page" : undefined} onClick={() => navigate(item.id)}>
              <Icon name={item.icon} className="nav-icon" /><span>{item.label}</span>
              {item.id === "practice" && <span className="nav-count">{exams.length}</span>}
              {item.id === "library" && <span className="nav-count">{formatNumber(questionBank.length)}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>InterPrep</span><span className="breadcrumb-separator">/</span><strong>{pageTitle}</strong></div>
          <span className="topbar-badge"><Icon name="code" /> Software development</span>
        </header>

        <main id="main-content" className={activeExam ? "exam-workspace" : "dashboard-shell"} ref={mainRef} tabIndex={-1}>
          {activeExam ? (
            <ExamRunner key={activeExam.id} exam={activeExam} onExit={() => navigate("practice")} />
          ) : (
            <>
              <div className="page-heading">
                <h1>{pageTitle}</h1>
              </div>

              {view === "overview" && (
                <section className="summary-grid" aria-label="Preparation resources">
                  {[
                    { icon: "book", tone: "mint", value: questionBank.length, label: "Questions" },
                    { icon: "exam", tone: "sand", value: exams.length, label: "Practice exams" },
                    { icon: "shield", tone: "lavender", value: scoredCount, label: "Scored questions" },
                    { icon: "layers", tone: "blue", value: topics.length, label: "Topics" },
                  ].map((stat) => (
                    <div className="summary-card" key={stat.label}>
                      <span className={`summary-icon ${stat.tone}`}><Icon name={stat.icon} /></span>
                      <div><strong className="summary-value">{formatNumber(stat.value)}</strong><span className="summary-label">{stat.label}</span></div>
                    </div>
                  ))}
                </section>
              )}

              <div className="content-layout">
                {view === "library" ? (
                  <section className="library-section" aria-label="Questions">
                    <div className="library-filters">
                      <div className="exam-search"><Icon name="search" /><input type="search" value={librarySearch} onChange={(event) => { setLibrarySearch(event.target.value); setLibraryPage(1); }} placeholder="Search questions, topics, or sources…" aria-label="Search question library" /></div>
                      <select value={topicFilter} aria-label="Filter questions by topic" onChange={(event) => { setTopicFilter(event.target.value); setLibraryPage(1); }}><option value="All">All topics</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select>
                    </div>
                    <p className="library-count" role="status">{formatNumber(filteredQuestions.length)} {filteredQuestions.length === 1 ? "question" : "questions"} found{filteredQuestions.length > 0 && ` · Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredQuestions.length)}`}</p>
                    {pageQuestions.length ? (
                      <>
                        <div className="library-list">{pageQuestions.map((question) => (
                          <article className="library-card" key={question.id}>
                            <div className="library-meta"><span>{question.topic || "General"}</span><span className={question.a === null || question.a === undefined ? "study-chip" : "topic-chip"}>{question.a === null || question.a === undefined ? "Study only" : "Answer included"}</span></div>
                            <h3>{question.q}</h3><p>{question.source || "Original question bank"}</p>
                          </article>
                        ))}</div>
                        <nav className="pagination" aria-label="Question library pages">
                          <button className="secondary" disabled={page === 1} onClick={() => { setLibraryPage(page - 1); focusMain(); }}>Previous</button>
                          <span className="pagination-label">Page {page} of {totalPages}</span>
                          <button className="secondary" disabled={page === totalPages} onClick={() => { setLibraryPage(page + 1); focusMain(); }}>Next <Icon name="arrow" /></button>
                        </nav>
                      </>
                    ) : (
                      <div className="catalog-empty"><Icon name="search" /><h3>No questions found</h3><p>Try another search or explore a different topic.</p><button className="secondary" onClick={() => { setLibrarySearch(""); setTopicFilter("All"); setLibraryPage(1); }}>Clear filters</button></div>
                    )}
                  </section>
                ) : (
                  <section className="exam-section" aria-labelledby="exams-heading">
                    <div className="section-heading"><h2 id="exams-heading">{view === "overview" ? "Practice exams" : activeCollection.label}</h2><span className="count-pill">{view === "overview" ? collectionExams.length : filteredExams.length} exams</span></div>
                    <div className="catalog-toolbar">
                      <div className="tabs" role="group" aria-label="Filter exam collection">{COLLECTIONS.map((collection) => <button className={`tab ${activeGroup === collection.id ? "active-tab" : ""}`} key={collection.id} aria-pressed={activeGroup === collection.id} onClick={() => { setActiveGroup(collection.id); setExamSearch(""); }}>{collection.label}</button>)}</div>
                      {view === "practice" && <div className="exam-search"><Icon name="search" /><input type="search" value={examSearch} onChange={(event) => setExamSearch(event.target.value)} placeholder="Find an exam…" aria-label="Search exams in this collection" /></div>}
                    </div>
                    <div className="exam-grid">{visibleExams.map((exam) => {
                      const questions = exam.ids.map((id) => byId.get(id)).filter(Boolean);
                      const scored = questions.filter((question) => question.a !== null && question.a !== undefined).length;
                      const examTopics = Array.from(new Set(questions.map((question) => question.topic || "General")));
                      return (
                        <article className="exam-card" key={exam.id}>
                          <div className="exam-card-top"><span className={`exam-icon tone-${activeCollection.tone}`}><Icon name={activeCollection.icon} /></span><span className="exam-mode">{scored === 0 ? "Study only" : "Scored"}</span></div>
                          <h3>{displayTitle(exam.title)}</h3>
                          {exam.group === "Imported Sessions" && <p className="exam-subtitle">{exam.subtitle.split(" · ")[0]}</p>}
                          <div className="exam-topics">{examTopics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}{examTopics.length > 2 && <span>+{examTopics.length - 2} topics</span>}{questions.length > scored && <span className="study-chip">{questions.length - scored} study only</span>}</div>
                          <div className="exam-card-footer"><span className="exam-length"><Icon name="exam" />{questions.length} questions</span><button className="start-button" onClick={() => startExam(exam.id)} aria-label={`Start ${exam.title}`}>Start {scored === 0 ? "session" : "exam"}<Icon name="arrow" /></button></div>
                        </article>
                      );
                    })}</div>
                    {!visibleExams.length && <div className="catalog-empty"><Icon name="search" /><h3>No exams found</h3><p>Try a different name or choose another collection.</p><button className="secondary" onClick={() => setExamSearch("")}>Clear search</button></div>}
                    {view === "overview" && <button className="view-all" onClick={() => navigate("practice")}>View all {collectionExams.length} exams <Icon name="arrow" /></button>}
                  </section>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
