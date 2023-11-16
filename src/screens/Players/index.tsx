import { useState, useEffect, useRef } from "react"
import { Alert, FlatList, TextInput } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Header } from "@components/Header"
import { Container, Form, HeaderList, NumbersOfPlayers } from "./styles"
import { Highlight } from "@components/Highlight"
import { ButtonIcon } from "@components/ButtonIcon"
import { Input } from "@components/Input"
import { Filter } from "@components/Filter"
import { PlayerCard } from "@components/PlayerCard"
import { ListEmpty } from "@components/ListEmpty"
import { Button } from "@components/Button"
import { AppError } from "@utils/AppError"
import { playerAddByGroup } from "@storage/player/playerAddByGroup"
import { playersGetByGroupAndTeam } from "@storage/player/playerGetByGroupAndTeam"
import { PlayerStorageDTO } from "@storage/player/PlayerStorageDTO"
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup"
import { groupRemoveByName } from "@storage/group/groupRemoveByName"
import { Loading } from "@components/Loading"

type RouteParams = {
    group: string
}

export function Players() {
    const [isLoading, setIsLoading] = useState(true)
    const [newPlayerName, SetNewPlayerName] = useState("")
    const [team, SetTeam] = useState("Time A")
    const [players, SetPlayers] = useState<PlayerStorageDTO[]>([])
    const navigation = useNavigation()
    const route = useRoute()
    const { group } = route.params as RouteParams
    const newPlayerNameInputRef = useRef<TextInput>(null)
    async function handleAddPlayer() {
        if (newPlayerName.trim().length === 0) {
            return Alert.alert("Nova Pessoa", "Informe o nome da pessoa para adicionar.")
        }
        const newPlayer = {
            name: newPlayerName,
            team
        }
        try {
            await playerAddByGroup(newPlayer, group)
            newPlayerNameInputRef.current?.blur()
            SetNewPlayerName("")
            fetchPlayersByTeam()
        } catch (error) {
            if (error instanceof AppError) {
                return Alert.alert("Nova Pessoa", error.message)
            }
            console.log(error)
            Alert.alert("Nova Pessoa", "Não foi possível adicionar uma nova pessoa.")
        }
    }
    async function fetchPlayersByTeam() {
        try {
            setIsLoading(true)
            const playersByTeam = await playersGetByGroupAndTeam(group, team)
            SetPlayers(playersByTeam)
        } catch (error) {
            console.log(error)
        } finally {
            setIsLoading(false)
        
        }
    }
    async function handlePlayerRemove(playerName: string) {
        try {
            await playerRemoveByGroup(playerName, group)
            fetchPlayersByTeam()
        } catch (error) {
            console.log(error)
            Alert.alert("Remover Pessoa", "Não foi possível remover a pessoa.")
        }
    }
    async function groupRemove() {
        try {
            await groupRemoveByName(group)
            navigation.navigate("groups")
        } catch (error) {
            console.log(error)
            Alert.alert("Remover Turma", "Não foi possível remover a turma.")
        }
    }
    async function handleGroupRemove() {
        Alert.alert("Remover", "Deseja remover a turma?", [
            {
                text: "Não",
                style: "cancel"
            },
            {
                text: "Sim",
                onPress: () => { groupRemove() }
            }
        ])
    }
    useEffect(() => {
        fetchPlayersByTeam()
    }, [team])
    return (
        <Container>
            <Header showBackButton />
            <Highlight title={group} subtitle="Adicione a galera e separe os times" />
            <Form>
                <Input placeholder="Nome da Pessoa" autoCorrect={false} onChangeText={SetNewPlayerName} value={newPlayerName} inputRef={newPlayerNameInputRef} onSubmitEditing={handleAddPlayer} returnKeyType="done" />
                <ButtonIcon icon="add" onPress={handleAddPlayer} />
            </Form>
            <HeaderList>
                <FlatList data={["Time A", "Time B"]} keyExtractor={item => item} renderItem={({ item }) => <Filter title={item} isActive={item === team} onPress={() => SetTeam(item)} />} horizontal />
                <NumbersOfPlayers>{players.length}</NumbersOfPlayers>
            </HeaderList>
            {isLoading ? <Loading/> : <FlatList data={players} keyExtractor={item => item.name} renderItem={({ item }) => <PlayerCard name={item.name} onRemove={() => handlePlayerRemove(item.name)} />} ListEmptyComponent={<ListEmpty message="Não há pessoas nesse time" />} showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: 100 }, players.length === 0 && { flex: 1 }]} /> }
            <Button title="Remover Turma" type="SECONDARY" onPress={handleGroupRemove} />
        </Container>
    )
}