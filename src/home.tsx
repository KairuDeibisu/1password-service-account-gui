import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import TimeoutControls from "./timeout-controls";
import { useUser } from "./useUser";


function Home() {
    const { setToken, getMe } = useUser();
    const nav = useNavigate();

    return (
        <div className="space-y-4 m-4 ">
            <form className="space-y-4">
                <Input
                    onChange={(e) => setToken(e.target.value)}
                    type="password"
                    autoComplete="off"
                    enterKeyHint="enter"
                    placeholder="Enter your token"
                />
                <Button
                    onClick={async (e) => {
                        e.preventDefault();
                        await getMe();

                        // Navigate to the items page
                        nav("/items");
                    }}
                >
                    Submit
                </Button>
            </form>
            <TimeoutControls />
        </div>
    );
}

export default Home;
