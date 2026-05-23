import { useState } from 'react';

import { Field, MoneyField, TextField, Textarea, Select } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function InputsPart() {
  const [gross, setGross] = useState('540,000');
  const [rent, setRent] = useState('1,800,000');
  const [note, setNote] = useState('');

  return (
    <div>
      <PartHeader index="14 / Primitives" title="Inputs" tagline="The ₦ money field, first" />

      <Scene label="Scene · the naira money field (the workhorse)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gross income" help="Enter monthly — we convert." htmlFor="gross">
            <MoneyField
              id="gross"
              fieldSize="lg"
              per="/mo"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
            />
          </Field>
          <Field label="Annual rent paid" help="Relief = 20%, capped ₦500k" htmlFor="rent">
            <MoneyField id="rent" value={rent} onChange={(e) => setRent(e.target.value)} />
          </Field>
        </div>
      </Scene>

      <Scene label="Scene · money field states">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default">
            <MoneyField placeholder="0" />
          </Field>
          <Field label="Small">
            <MoneyField fieldSize="sm" placeholder="0" />
          </Field>
          <Field label="Invalid" error="Income can’t be negative.">
            <MoneyField invalid defaultValue="-200,000" />
          </Field>
          <Field label="Disabled — awaiting profile">
            <MoneyField disabled placeholder="Pick a profile first" />
          </Field>
        </div>
      </Scene>

      <Scene label="Scene · generic fields">
        <div className="grid gap-4">
          <Field label="Employment type" htmlFor="emp">
            <Select id="emp" defaultValue="paye">
              <option value="paye">Salaried — PAYE</option>
              <option value="self">Self-employed</option>
              <option value="mixed">Mixed</option>
            </Select>
          </Field>
          <Field
            label="Ask TaxLens a follow-up"
            help="TaxLens explains your computed result — it won’t compute a new number."
            htmlFor="ask"
          >
            <Textarea
              id="ask"
              placeholder="Why is my effective rate 11.4%?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <Field label="Plain text">
            <TextField placeholder="e.g. Acme Ltd" />
          </Field>
        </div>
      </Scene>
    </div>
  );
}
