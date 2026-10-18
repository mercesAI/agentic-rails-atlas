import { Component, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Protocol slug; the frame loads src/playgrounds/<slug>/Playground.tsx on mount. */
  slug?: string;
  /** Spec version the simulation follows. */
  specVersion: string;
  title?: string;
  /** Render these instead of loading a playground module. */
  children?: ReactNode;
}

type Loader = () => Promise<{ default: ComponentType }>;

// Vite resolves this at build time; each playground becomes its own chunk, loaded only when the frame mounts.
const PLAYGROUNDS = import.meta.glob<{ default: ComponentType }>('../../playgrounds/*/Playground.tsx');

function loaderFor(slug: string): Loader | undefined {
  return PLAYGROUNDS[`../../playgrounds/${slug}/Playground.tsx`] as Loader | undefined;
}

class Boundary extends Component<{ children: ReactNode; onReset: () => void }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
  componentDidCatch(_err: unknown, _info: ErrorInfo) {
    // Errors stay in the browser; nothing is reported anywhere.
  }
  render() {
    if (this.state.error) {
      return (
        <div className="pg__error" role="alert">
          <p>The simulation stopped with an error: {this.state.error}</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
          >
            Reset the simulation
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Frame for every playground: "Simulation, no real funds", the spec version and a reset button. */
export default function PlaygroundFrame({ slug, specVersion, title, children }: Props) {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>(children ? 'ready' : 'idle');
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (children || !slug) return;
    const load = loaderFor(slug);
    if (!load) {
      setState('missing');
      return;
    }
    let alive = true;
    setState('loading');
    load()
      .then((m) => {
        if (!alive) return;
        setComp(() => m.default);
        setState('ready');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [slug, children]);

  return (
    <div className="pg">
      <div className="pg__bar">
        <p className="pg__label">
          <span className="pg__badge">Simulation, no real funds</span>
          <span className="pg__version">Follows spec version {specVersion}</span>
        </p>
        <button type="button" className="btn" onClick={() => setResetKey((k) => k + 1)} disabled={state !== 'ready'}>
          Reset
        </button>
      </div>
      {/* A labeled region, so the title is exposed; a plain div ignores aria-label. */}
      {/* Busy until the simulation is ready, including the server render ('idle'), which shows the loading note. */}
      <div className="pg__body" role={title ? 'region' : undefined} aria-busy={state === 'idle' || state === 'loading'} aria-label={title}>
        {state === 'ready' && (
          <Boundary key={resetKey} onReset={() => setResetKey((k) => k + 1)}>
            {children ?? (Comp ? <Comp /> : null)}
          </Boundary>
        )}
        {(state === 'idle' || state === 'loading') && <p className="pg__status">Loading the simulation.</p>}
        {state === 'missing' && <p className="pg__status">The simulation for this protocol is not built yet.</p>}
        {state === 'error' && <p className="pg__status">The simulation could not be loaded. Reload the page to try again.</p>}
      </div>
      <p className="pg__foot">
        Keys are generated in this browser for this session only, on test chain identifiers or fixture data. No wallet
        connects and nothing is sent to a network.
      </p>
    </div>
  );
}
