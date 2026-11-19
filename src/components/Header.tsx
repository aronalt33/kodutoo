export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <img src="/logo.png" alt="Compensa" className="logo" />
        <div>
          <h1>Müügitulemused ja analüütika</h1>
          <p className="lead">
            Arvutab valitud perioodi müügitulemused, võrdleb neid eelmise perioodiga ja koostab andmete põhjal juhtimisraporti.
          </p>
        </div>
      </div>
      <div className="header-stripe" />
    </header>
  );
}
