function AnimatedList({
  items,
  getItemKey,
  renderItem,
  className = '',
  staggerMs = 45,
  durationMs = 320,
}) {
  const animationKey = items.map((item) => getItemKey(item)).join('|')

  return (
    <ul className={className} key={animationKey}>
      {items.map((item, index) => (
        <li
          key={getItemKey(item)}
          className="animated-list-item"
          style={{
            animationDelay: `${index * staggerMs}ms`,
            animationDuration: `${durationMs}ms`,
          }}
        >
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  )
}

export default AnimatedList
