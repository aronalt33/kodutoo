export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <img src="/logo.png" alt="Compensa" className="logo" />
        <div>
          <h1>Müügikoosoleku kokkuvõtte tegija</h1>
          <p className="lead">
            Arvutab müügiandmetest põhinäitajad ja koostab nende põhjal lühikese kokkuvõtte müügikoosolekuks.
          </p>
        </div>
      </div>
      <div className="header-stripe" />
    </header>
  );
}
