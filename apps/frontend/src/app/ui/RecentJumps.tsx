import { useEhContext } from '../context/EhContext';
import { Section } from './Section';

export function RecentJumps() {
  const { recentJumps } = useEhContext();

  return (
    <div>
      <Section title="🕒 Last jumps">
        <ul>
          {recentJumps.map(jump => <li
            key={`${jump.app}-${jump.env}-${jump.substitution}`}><a href={jump.url} className="hover:underline">{jump.url}</a></li>)}
        </ul>
      </Section>
    </div>);
}
