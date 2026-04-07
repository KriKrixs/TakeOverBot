FROM mcr.microsoft.com/dotnet/runtime:10.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["TakeOverBot.csproj", "./"]
RUN dotnet restore "TakeOverBot.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "./TakeOverBot.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./TakeOverBot.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/Data && chmod 777 /app/Data
ENTRYPOINT ["dotnet", "TakeOverBot.dll"]
