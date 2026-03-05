import LogoutButton from "./deconnexion"

export const NavBar = ({titre}) =>{
    return <div>
        <nav className="flex items-center justify-between bg-indigo-950 w-full h-full p-2">
            <h1 className="text-white text-2xl font-bold">{titre}</h1>
            <LogoutButton/>
        </nav>
    </div>
}