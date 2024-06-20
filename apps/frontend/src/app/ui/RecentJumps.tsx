import { useEhContext } from '../context/EhContext';
import { Section } from './Section';
import { JumpMiniButton } from './JumpMiniButton';

export function RecentJumps() {
  const { recentJumps, getEnvById, getAppById, getSubstitutionValueById, setApp, setEnv, setSubstitution } = useEhContext();



  return (
    <div>
      <Section title="🕒 Last jumps">
        <table className="w-full table-auto">
          <thead>
          <tr className="text-left">
            <th scope="col" className="px-2 ">Env</th>
            <th scope="col" className="px-2 ">App</th>
            <th scope="col" className="px-2 ">Context</th>
            <th scope="col" className="px-2 "></th>
          </tr>
          </thead>
          <tbody>
          {recentJumps.map((jump) => (
            <tr key={`${jump.app}-${jump.env}-${jump.substitution}`} className="hover:bg-gray-100 dark:hover:bg-gray-900">
              <td className="px-2 py-2 cursor-pointer hover:underline" onClick={() => setEnv(getEnvById(jump.env))}>{jump.env}</td>
              <td className="px-2 py-2 cursor-pointer hover:underline" onClick={() => setApp(getAppById(jump.app))}>{jump.app}</td>
              <td className="px-2 py-2 cursor-pointer hover:underline" onClick={() => setSubstitution(getSubstitutionValueById(jump.env, jump.app, jump.substitution))}>{jump.substitution}</td>
              <td className="px-2 py-2"><JumpMiniButton env={getEnvById(jump.env)} app={getAppById(jump.app)}
                                                        substitution={getSubstitutionValueById(jump.env, jump.app, jump.substitution)} />
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
