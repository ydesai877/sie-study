// First page: pick a subject.
export default function Home() {
  return (
    <main className="home">
      <h1>What do you want to study?</h1>
      <div className="subject-grid">
        <a className="subject-btn" href="#/acc/dashboard">Accounting</a>
        <a className="subject-btn" href="#/dashboard">SIE</a>
      </div>
    </main>
  )
}
