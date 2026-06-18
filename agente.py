import sys
import asyncio
from google.antigravity import Agent, LocalAgentConfig

# Configuração simples para este repositório
config = LocalAgentConfig(
    system_instructions="Você é um engenheiro de software experiente. Analise o código do diretório atual e faça as edições solicitadas."
)

async def rodar_ia():
    async with Agent(config) as agent:
        # Um prompt simples de teste para ele mexer no README
        prompt = """
        1. Leia o arquivo README.md deste projeto.
        2. Adicione uma nova linha no final dele dizendo: 'Este projeto está sendo otimizado por IA.'
        """
        
        print("O Agente está a pensar...\n")
        
        response = await agent.chat(prompt)
        async for chunk in response:
            sys.stdout.write(chunk)
            sys.stdout.flush()

# Executa o código (padrão fora do Colab)
if __name__ == "__main__":
    asyncio.run(rodar_ia())