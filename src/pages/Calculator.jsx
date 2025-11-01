import { useState } from 'react'

function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue
      case '-':
        return firstValue - secondValue
      case '*':
        return firstValue * secondValue
      case '/':
        return firstValue / secondValue
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">Taschenrechner 🧮</h1>
      <p className="page-subtitle">
        Ein minimalistischer Taschenrechner für Grundrechenarten
      </p>

      <div className="calculator">
        <div className="calculator-display">
          {display}
        </div>

        <div className="calculator-buttons">
          {/* Zeile 1: Clear und Operatoren */}
          <button className="calculator-button clear" onClick={clear}>
            C
          </button>
          <button className="calculator-button operator" onClick={() => performOperation('/')}>
            ÷
          </button>
          <button className="calculator-button operator" onClick={() => performOperation('*')}>
            ×
          </button>
          <button className="calculator-button operator" onClick={() => performOperation('-')}>
            −
          </button>

          {/* Zeile 2: 7, 8, 9 und + (erstreckt sich über 3 Zeilen) */}
          <button className="calculator-button" onClick={() => inputDigit(7)}>
            7
          </button>
          <button className="calculator-button" onClick={() => inputDigit(8)}>
            8
          </button>
          <button className="calculator-button" onClick={() => inputDigit(9)}>
            9
          </button>
          <button className="calculator-button operator tall" onClick={() => performOperation('+')}>
            +
          </button>

          {/* Zeile 3: 4, 5, 6 */}
          <button className="calculator-button" onClick={() => inputDigit(4)}>
            4
          </button>
          <button className="calculator-button" onClick={() => inputDigit(5)}>
            5
          </button>
          <button className="calculator-button" onClick={() => inputDigit(6)}>
            6
          </button>

          {/* Zeile 4: 1, 2, 3 */}
          <button className="calculator-button" onClick={() => inputDigit(1)}>
            1
          </button>
          <button className="calculator-button" onClick={() => inputDigit(2)}>
            2
          </button>
          <button className="calculator-button" onClick={() => inputDigit(3)}>
            3
          </button>

          {/* Zeile 5: 0 (breit), . und = */}
          <button className="calculator-button wide" onClick={() => inputDigit(0)}>
            0
          </button>
          <button className="calculator-button" onClick={inputDecimal}>
            .
          </button>
          <button className="calculator-button equals" onClick={handleEquals}>
            =
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Features</h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li>Grundrechenarten: Addition, Subtraktion, Multiplikation, Division</li>
          <li>Dezimalzahlen-Unterstützung</li>
          <li>Kettenrechnungen möglich</li>
          <li>Modernes, responsives Design</li>
        </ul>
      </div>
    </div>
  )
}

export default Calculator
