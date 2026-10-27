"""Accesso al database di prova (PostgreSQL). Le impostazioni arrivano dalle variabili PG* (vedi tests/run.sh)."""
import os, subprocess
def q(sql, role='anon'):
    """Esegue una query con il ruolo indicato (come farebbe il server). Risponde (output, errore)."""
    r = subprocess.run(['psql', '-qtA', '-v', 'ON_ERROR_STOP=1', '-c', 'set role %s; %s' % (role, sql)], capture_output=True, text=True, env=os.environ)
    return (r.stdout.strip(), r.stderr.strip())
def admin(sql):
    r = subprocess.run(['psql', '-qtA', '-v', 'ON_ERROR_STOP=1', '-c', sql], capture_output=True, text=True, env=os.environ)
    return r.stdout.strip()
