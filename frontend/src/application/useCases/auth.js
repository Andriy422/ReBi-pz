// APPLICATION: сценарії авторизації. Вони не знають, мок це чи справжній бекенд.
export function makeGetCurrentUser({ authRepository }) {
  return () => authRepository.getCurrentUser()
}

export function makeSignInWithGoogle({ authRepository }) {
  return () => authRepository.signInWithGoogle()
}

export function makeSignOut({ authRepository }) {
  return () => authRepository.signOut()
}
