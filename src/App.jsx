import { useEffect, useMemo, useState } from 'react'
import AnimatedList from './components/AnimatedList'
import './App.css'

const PEOPLE_URL = 'https://swapi.dev/api/people/'

async function fetchAllPeople() {
  let url = PEOPLE_URL
  const results = []

  while (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Kunde inte hämta personer från SWAPI.')
    }

    const data = await response.json()
    results.push(...data.results)
    url = data.next
  }

  return results
}

function App() {
  const [people, setPeople] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [homeworldName, setHomeworldName] = useState('Okänd')
  const [filmTitles, setFilmTitles] = useState([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPeople() {
      try {
        setIsLoading(true)
        const allPeople = await fetchAllPeople()

        if (!isMounted) return

        setPeople(allPeople)
        setSelectedPerson(allPeople[0] ?? null)
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : 'Något gick fel.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPeople()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadPersonDetails() {
      if (!selectedPerson) {
        setHomeworldName('Okänd')
        setFilmTitles([])
        return
      }

      try {
        setIsDetailsLoading(true)

        const homeworldPromise = selectedPerson.homeworld
          ? fetch(selectedPerson.homeworld).then((response) => {
              if (!response.ok) throw new Error('Kunde inte hämta hemvärld.')
              return response.json()
            })
          : Promise.resolve({ name: 'Okänd' })

        const filmsPromise = selectedPerson.films.length
          ? Promise.all(
              selectedPerson.films.map(async (filmUrl) => {
                const response = await fetch(filmUrl)
                if (!response.ok) throw new Error('Kunde inte hämta filmer.')
                return response.json()
              }),
            )
          : Promise.resolve([])

        const [homeworld, films] = await Promise.all([homeworldPromise, filmsPromise])

        if (!isMounted) return

        setHomeworldName(homeworld.name || 'Okänd')
        setFilmTitles(
          films
            .map((film) => film.title)
            .sort((a, b) => a.localeCompare(b, 'sv')),
        )
      } catch {
        if (!isMounted) return
        setHomeworldName('Kunde inte hämta')
        setFilmTitles([])
      } finally {
        if (isMounted) {
          setIsDetailsLoading(false)
        }
      }
    }

    loadPersonDetails()

    return () => {
      isMounted = false
    }
  }, [selectedPerson])

  const genderOptions = useMemo(() => {
    const options = new Set(people.map((person) => person.gender).filter(Boolean))
    return ['all', ...Array.from(options)]
  }, [people])

  const filteredPeople = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return people.filter((person) => {
      const matchesSearch = person.name.toLowerCase().includes(normalizedSearch)
      const matchesGender = genderFilter === 'all' || person.gender === genderFilter
      return matchesSearch && matchesGender
    })
  }, [people, searchTerm, genderFilter])

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Star Wars People Explorer</h1>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="controls">
            <input
              type="search"
              placeholder="Sök person..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Alla kön' : option}
                </option>
              ))}
            </select>
          </div>

          {isLoading && <p className="status">Laddar personer...</p>}
          {error && <p className="status error">{error}</p>}

          {!isLoading && !error && filteredPeople.length === 0 && (
            <p className="status">Inga träffar.</p>
          )}

          {!isLoading && !error && filteredPeople.length > 0 && (
            <AnimatedList
              className="people-list"
              items={filteredPeople}
              getItemKey={(person) => person.url}
              renderItem={(person) => {
                const isActive = selectedPerson?.url === person.url

                return (
                  <button
                    type="button"
                    className={`person-button ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedPerson(person)}
                  >
                    {person.name}
                  </button>
                )
              }}
            />
          )}
        </aside>

        <section className="details">
          {!selectedPerson && <p className="status">Välj en person i listan.</p>}

          {selectedPerson && (
            <article>
              <h2>{selectedPerson.name}</h2>
              <dl>
                <div>
                  <dt>Height</dt>
                  <dd>{selectedPerson.height} cm</dd>
                </div>
                <div>
                  <dt>Mass</dt>
                  <dd>{selectedPerson.mass} kg</dd>
                </div>
                <div>
                  <dt>Hair color</dt>
                  <dd>{selectedPerson.hair_color}</dd>
                </div>
                <div>
                  <dt>Skin color</dt>
                  <dd>{selectedPerson.skin_color}</dd>
                </div>
                <div>
                  <dt>Eye color</dt>
                  <dd>{selectedPerson.eye_color}</dd>
                </div>
                <div>
                  <dt>Birth year</dt>
                  <dd>{selectedPerson.birth_year}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{selectedPerson.gender}</dd>
                </div>
                <div>
                  <dt>Homeworld</dt>
                  <dd>{isDetailsLoading ? 'Laddar...' : homeworldName}</dd>
                </div>
                <div>
                  <dt>Films</dt>
                  <dd>
                    {isDetailsLoading
                      ? 'Laddar...'
                      : filmTitles.length > 0
                        ? filmTitles.join(', ')
                        : 'Inga filmer'}
                  </dd>
                </div>
              </dl>
            </article>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
